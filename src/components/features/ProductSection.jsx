import React from 'react';

const ProductSection = ({ title, description, buttonText, imgSrc, imageSide = 'right' }) => {
    const rowDirection = imageSide === 'right' ? 'lg:flex-row' : 'lg:flex-row-reverse';
    return (
        <section className="py-12 lg:py-24 bg-white">
            <div className={`container mx-auto px-6 flex flex-col ${rowDirection} items-center justify-around gap-12`}>
                <div className="lg:w-1/3 text-center lg:text-left">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-duo-blue mb-4">{title}</h2>
                    <p className="text-lg text-duo-text mb-6">{description}</p>
                    <button className="w-full sm:w-auto bg-white text-duo-blue font-bold uppercase tracking-wider py-3 px-6 rounded-2xl border-2 border-duo-gray hover:bg-gray-100 transition">
                        {buttonText}
                    </button>
                </div>
                <div className="lg:w-1/2 flex justify-center">
                    <img src={imgSrc} alt={title} className="max-w-xs mx-auto lg:max-w-sm" />
                </div>
            </div>
        </section>
    );
};

export default ProductSection;