/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

type ImageStatus = 'pending' | 'done' | 'error';

interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

interface ProfileCardProps {
    images: GeneratedImage[];
    styleName: string;
    onRegenerate?: (styleName: string, index: number) => void;
    onDownload?: (styleName: string, index: number) => void;
}

const ShimmerLoader = () => (
    <div className="absolute inset-0 bg-neutral-200 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200" />
    </div>
);

const ErrorDisplay = ({ error }: { error?: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-red-600 p-4 bg-red-50">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="text-sm font-semibold">Generation Failed</p>
        <p className="text-xs text-red-500 mt-1 truncate" title={error}>
            {error || "An unknown error occurred."}
        </p>
    </div>
);


const ProfileCard: React.FC<ProfileCardProps> = ({ images, styleName, onRegenerate, onDownload }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const image = images[currentIndex];
    const { status, url: imageUrl, error } = image || { status: 'pending' };

    const handleNext = () => setCurrentIndex(i => (i + 1) % images.length);
    const handlePrev = () => setCurrentIndex(i => (i - 1 + images.length) % images.length);


    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col aspect-[4/5] w-full">
            <div className="w-full bg-neutral-200 flex-grow relative overflow-hidden group">
                {status === 'pending' && <ShimmerLoader />}
                {status === 'error' && <ErrorDisplay error={error} />}
                {status === 'done' && imageUrl && (
                     <motion.div
                        key={`${imageUrl}-${currentIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="w-full h-full"
                    >
                        <img
                            src={imageUrl}
                            alt={`${styleName} variation ${currentIndex + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                )}
                 <div className={cn(
                    "absolute top-3 right-3 z-10 flex flex-col gap-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100",
                )}>
                    {onDownload && (
                        <button
                            onClick={() => onDownload(styleName, currentIndex)}
                            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white transition-all hover:scale-110"
                            aria-label={`Download image for ${styleName}`}
                        >
                            <Download className="h-4 w-4" />
                        </button>
                    )}
                     {onRegenerate && (
                        <button
                            onClick={() => onRegenerate(styleName, currentIndex)}
                            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white transition-all hover:scale-110"
                            aria-label={`Regenerate image for ${styleName}`}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    )}
                </div>
                 {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            aria-label="Previous image"
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 rounded-full text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNext}
                            aria-label="Next image"
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 rounded-full text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-colors",
                                        currentIndex === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                                    )}
                                    aria-label={`Go to variation ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                 )}
            </div>
            <div className="text-center p-3 border-t border-neutral-100 flex items-center justify-center">
                <p className="font-semibold text-sm text-neutral-800 truncate mr-2">
                    {styleName}
                </p>
                <span className="text-xs text-neutral-400 bg-neutral-100 rounded-full px-2 py-0.5">
                    {currentIndex + 1} / {images.length}
                </span>
            </div>
        </div>
    );
};

// Simple icon components for the UI
const Download = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
);

const RefreshCw = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M3 12a9 9 0 0 1 9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
    </svg>
);

const AlertTriangle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
);

const ChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6"/>
    </svg>
);
const ChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

export default ProfileCard;