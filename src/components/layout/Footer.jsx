import React from 'react';
import shreyansImg from '../../assets/images/shreyans.jpg';
import mallikaImg from '../../assets/images/mallika.jpg';
import anuragImg from '../../assets/images/anurag.jpg';
import ayushImg from '../../assets/images/ayush.jpg';

const Footer = () => {
    const collegeRegex = /(IIM Ahmedabad|IIT Roorkee|IIM Bangalore|IIT Bombay|SRCC|IIT Dhanbad)/g;
    const collegeRegexCheck = /(IIM Ahmedabad|IIT Roorkee|IIM Bangalore|IIT Bombay|SRCC|IIT Dhanbad)/;

    const renderHighlighted = (text) => {
        const parts = text.split(collegeRegex);
        return parts.map((part, idx) => (
            collegeRegexCheck.test(part) ? <span key={idx} className="font-bold">{part}</span> : part
        ));
    };
    const team = [
        {
            name: 'Mallika Chawla',
            role: 'Content wizard',
            img: mallikaImg,
            lines: ['IIM Ahmedabad \'24', 'SRCC \'20'],
            linkedin: 'https://linkedin.com/in/mallika-chawla'
        },
        {
            name: 'Shreyans Bhansali',
            role: 'Storytelling Sensei',
            img: shreyansImg,
            lines: ['IIM Bangalore \'27', 'IIT Bombay \'20'],
            linkedin: 'https://linkedin.com/in/shreyans-bhansali-717568281'
        },
        {
            name: 'Anurag Tomar',
            role: 'Product Guardian',
            img: anuragImg,
            lines: ['IIM Ahmedabad \'21', 'IIT Roorkee \'19'],
            linkedin: 'https://linkedin.com/in/anurag-singh-450585114'
        },
        {
            name: 'Ayush Chaurasia',
            role: 'Backend Ninja',
            img: ayushImg,
            lines: ['IIT Dhanbad \'27'],
            linkedin: 'https://linkedin.com/in/ayush-chaurasiya-7b2932287'
        }
    ];

    return (
        <footer className="text-white pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-12 md:pb-16 w-full" style={{backgroundColor: '#1E65FA'}}>
            <div className="w-full px-4 sm:px-6 md:px-8">
                <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-semibold mb-8 sm:mb-10 md:mb-12">Contact our Team</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 md:gap-16">
                    {team.map(member => (
                        <div key={member.name} className="flex flex-col items-center text-center w-full max-w-xs h-full">
                            <img
                                src={member.img}
                                alt={member.name}
                                className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-2 sm:border-4 border-white/40 shadow-md mb-4 sm:mb-6"
                            />
                            <p className="text-lg sm:text-xl md:text-2xl font-semibold mb-1 sm:mb-2 text-overflow-fix">{member.name}</p>
                            <p className="italic text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-3 sm:mb-4 text-overflow-fix">{member.role}</p>
                            <div className="flex flex-col items-center flex-grow justify-between min-h-[100px] sm:min-h-[120px]">
                                <div>
                                    {member.lines.map((line, idx) => (
                                        <p key={idx} className="text-sm sm:text-base md:text-lg text-white/80 mb-1 text-overflow-fix">{renderHighlighted(line)}</p>
                                    ))}
                                </div>
                                <div className="mt-auto">
                                    <a 
                                        href={member.linkedin} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hover:scale-110 transition-transform duration-200"
                                    >
                                        <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-300 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-6 sm:pt-8 mt-8 sm:mt-10 md:mt-12 text-center text-white/80 text-sm sm:text-base md:text-lg">
                    <p className="text-overflow-fix">We would love to hear from you. Reach out to any of us!</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;