// src/data.js

// Step 1: Import all your local images
// IMPORTANT: Replace the file paths with your actual image filenames.
import featureImage1 from '../assets/images/image-01.png'; // Image for 'free. fun. effective.'
import featureImage2 from '../assets/images/image-02.png'; // Image for 'backed by science'
import featureImage3 from '../assets/images/image-03.png'; // Image for 'stay motivated'
import featureImage4 from '../assets/images/image-04.png'; // Image for 'personalized learning'

import productImage1 from '../assets/images/image-05.png'; // Image for 'english test'
import productImage2 from '../assets/images/image-06.png'; // Image for 'for schools'
import productImage3 from '../assets/images/image-03.png'; // Image for 'abc'
import productImage4 from '../assets/images/image-01.png'; // Image for 'math'


// Step 2: Use the imported variables in your data arrays
export const features = [
    {
      title: 'free. fun. effective.',
      description: 'Your one-stop buddy for everything study — super easy to start and totally free!',
      imgSrc: featureImage1, // Use variable here
      imageSide: 'right',
    },
    {
      title: 'because learning shouldn’t be boring',
      description: '        Your Study buddy and yaar, HoshiYaar is here to make learning smart, simple, and seriously fun.',
      imgSrc: featureImage2, // Use variable here
      imageSide: 'left',
    },
     {
        title: 'stay motivated',
        description: 'We make it easy to form a habit of language learning with game-like features, fun challenges, and reminders from our friendly mascot, Duo the owl.',
        imgSrc: featureImage3, // Use variable here
        imageSide: 'right',
    },
    {
        title: 'personalized learning',
        description: 'Combining the best of AI and language science, lessons are tailored to help you learn at just the right level and pace.',
        imgSrc: featureImage4, // Use variable here
        imageSide: 'left',
    }
];

export const products = [
      {
          title: 'hoshiyaar english test',
          description: 'Our convenient, fast, and affordable English test integrates the latest assessment science and AI — empowering anyone to accurately test their English where and when they’re at their best.',
          buttonText: 'Certify your english',
          imgSrc: productImage1, // Use variable here
          imageSide: 'right',
      },
      {
        title: 'hoshiyaar for schools',
        description: 'Free teacher tools to help students learn languages through the Duolingo app, both in and out of the classroom.',
        buttonText: 'Bring Hoshiyaar to your classroom',
        imgSrc: productImage2, // Use variable here
        imageSide: 'left',
    },
    {
        title: 'hoshiyaar abc',
        description: 'From the makers of Duolingo, the world’s #1 education app, comes Duolingo ABC! This fun, hands-on app teaches kids ages 3-8 how to read.',
        buttonText: 'Learn more about ABC',
        imgSrc: productImage3, // Use variable here
        imageSide: 'right',
    },
    {
        title: 'hoshiyaar math',
        description: 'From the makers of Duolingo, comes a new way for kids to learn math! This fun app helps students get ahead in their math classes, while adults can train their brains.',
        buttonText: 'Get better at math',
        imgSrc: productImage4, // Use variable here
        imageSide: 'left',
    },
];