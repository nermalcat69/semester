import { Metadata } from "next";
import Generate from "../components/generate";
import { promises as fs } from 'fs';

export const metadata: Metadata = {
    title: "Web Development Roadmap",
    description: "Full stack development with JavaScript and NextJS",
    twitter: {
        card: 'summary_large_image',
        title: 'Web Development Roadmap',
        description: 'Full stack development with JavaScript and NextJS',
        images: ['https://i.imgur.com/sy7ZTsr.png'],
    },
    openGraph: {
        siteName: "One Semester",
        title: 'Web Development Roadmap',
        description: 'Full stack development with JavaScript and NextJS',
        images: [
            {
                url: 'https://i.imgur.com/sy7ZTsr.png', 
                width: 800,
                height: 600,
            },
            {
                url: 'https://i.imgur.com/sy7ZTsr.png',
                width: 1800,
                height: 1600,
                alt: 'My custom alt',
            },
        ],
    }
}

export default async function Web() {
    const file = await fs.readFile(process.cwd() + '/app/data/web.json', 'utf8');
    const data = JSON.parse(file) as LearningPlan;
    return <Generate learningPlan={data} />
}