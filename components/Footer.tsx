/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REMIX_IDEAS = [
    "to create a professional headshot.",
    "to design a new gaming avatar.",
    "to see yourself in a fantasy art style.",
    "to generate a cartoon version of your pet.",
    "to place yourself in a famous movie scene.",
    "to create a custom emoji of your face.",
];

const Footer = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setIndex(prevIndex => (prevIndex + 1) % REMIX_IDEAS.length);
        }, 3500);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <footer className="w-full bg-neutral-50 p-3 z-50 text-neutral-500 text-xs sm:text-sm mt-8">
            <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 px-4 border-t border-neutral-200 pt-4">
                {/* Left Side */}
                <div className="flex items-center gap-4 text-neutral-500 whitespace-nowrap text-center sm:text-left">
                    <p>Powered by Gemini 2.5 Flash Image Preview</p>
                    <span className="text-neutral-300 hidden sm:inline" aria-hidden="true">|</span>
                    <p className="hidden sm:inline">
                        Created by{' '}
                        <a
                            href="https://x.com/ammaar"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-600 hover:text-blue-600 font-medium transition-colors duration-200"
                        >
                            @ammaar
                        </a>
                    </p>
                </div>

                {/* Right Side */}
                <div className="flex-grow flex justify-center sm:justify-end items-center gap-4 sm:gap-6">
                    <div className="hidden lg:flex items-center gap-2 text-right min-w-0">
                        <span>Remix this app...</span>
                        <div className="relative w-56 h-5">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="absolute inset-0 font-medium text-neutral-800 whitespace-nowrap text-left"
                                >
                                    {REMIX_IDEAS[index]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="https://aistudio.google.com/apps"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm text-center text-white bg-blue-600 py-2 px-4 rounded-lg transform transition-transform duration-200 hover:scale-105 hover:bg-blue-500 shadow-sm whitespace-nowrap"
                        >
                            Apps on AI Studio
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;