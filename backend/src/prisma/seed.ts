import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    //Create user
    const user = await prisma.user.upsert({
        where: { email: 'delontest@gmail.com' },
        update: {},
        create: {
            email: 'delontest@gmail.com',
            name: 'Delon Toh',
        },
    });

    console.log('Created user successfully:', user.name);

    //Create documents
    const documentNames = [
        ['Monthly Budget.xlsx', 'Invoice Template.pdf', 'Expense Report.docx'],
        ['Logo Design.ai', 'Brand Guidelines.pdf', 'Color Palette.png'],
        ['Terms of Service.pdf', 'Privacy Policy.docx', 'Compliance Report.pdf'],
        ['Q4 Sales Report.pdf', 'Annual Review.docx', 'Performance Metrics.xlsx'],
        ['Old Contracts Archive.zip', 'Historical Data.xlsx', 'Backup Files.zip'],
    ];

    const documents = await Promise.all(
        documentNames.map((docs) =>
            prisma.document.upsert({
                where: { name: docs[0] },
                update: {},
                create: { 
                    name: docs[0], 
                    file_size: `${Math.floor(Math.random() * 500) + 50} KB`, 
                    document_user_id: user.id, 
                },
            })
        )
    );

    console.log(`Created ${documents.length} documents successfully`);

    //Create folders
    const folderNames = [
        'Project Documents',
        'Client Contracts',
        'Meeting Notes',
        'Financial Records',
        'Design Assets',
        'Legal Documents',
        'Reports',
        'Archives',
    ];

    const folders = await Promise.all(
        folderNames.map((name) =>
            prisma.folder.upsert({
                where: { name },
                update: {},
                create: {
                    name,
                    folders_user_id: user.id,
                },
            })
        )
    );

    console.log(`Created ${folders.length} folders successfully`);

    //Create documents for each folder
    const documentsInFolders= [
        ['Project Proposal.pdf', 'Project Timeline.xlsx', 'Requirements Document.docx'],
        ['Service Agreement.pdf', 'NDA Template.docx', 'Contract Amendment.pdf'],
        ['Weekly Standup Notes.docx', 'Client Meeting Minutes.pdf', 'Action Items.xlsx']
    ];

    let totalDocuments = 0;
    for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        const docs = documentsInFolders[i] || [];

        const createdDocs = await Promise.all(
            docs.map((docName) =>
                prisma.document.upsert({
                    where: { name: docName },
                    update: {},
                    create: {
                        name: docName,
                        file_size: `${Math.floor(Math.random() * 500) + 50} KB`,
                        document_user_id: user.id,
                        folder_document_id: folder.id,
                    },
                })
            )
        );

        totalDocuments += createdDocs.length;
        console.log(`Created ${createdDocs.length} documents in "${folder.name}" successfully`);
    }
    console.log(`Seed completed`);
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

