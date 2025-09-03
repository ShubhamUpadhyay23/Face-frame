/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStyledImage } from './services/geminiService';
import ProfileCard from './components/PolaroidCard';
import { createAlbumPage } from './lib/albumUtils';
import Footer from './components/Footer';


const STYLES = ['Instagram', 'LinkedIn', 'WhatsApp', 'Facebook'];

const BASE_PROMPTS: Record<string, string> = {
    'Instagram': `Generate a trendy, aesthetic, and colorful influencer-style profile picture. The background should be visually interesting.`,
    'LinkedIn': `Generate a clean, formal, corporate headshot. The background should be neutral and professional (e.g., a simple office blur or solid color). The lighting must be sharp and flattering.`,
    'WhatsApp': `Generate a natural, friendly, and casual profile picture with warm tones. The style should be relaxed and approachable, like a photo taken by a friend.`,
    'Facebook': `Generate a sharp but casual profile picture. The lighting should be balanced and the look classic and timeless.`,
};

const getPrompt = (style: string, variation: number): string => {
    const basePrompt = BASE_PROMPTS[style];
    const identityLock = `It is absolutely crucial to preserve the exact facial identity, features, and structure of the person in the uploaded photo. Do not alter their face in any way. Only change the style, background, and outfit.`;
    const outputRequirements = `The output must be a high-resolution, square image (1024x1024).`;
    const variationPrompt = variation === 2 ? `Provide a second variation with a slightly different pose, angle, or background.` : '';
    return `${identityLock} ${basePrompt} ${outputRequirements} ${variationPrompt}`;
};


type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

const primaryButtonClasses = "text-md text-center text-white bg-blue-600 py-3 px-6 rounded-xl transform transition-all duration-300 hover:scale-105 hover:bg-blue-500 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
const secondaryButtonClasses = "text-md text-center text-neutral-700 bg-neutral-200 py-3 px-6 rounded-xl transform transition-all duration-300 hover:scale-105 hover:bg-neutral-300 shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-opacity-75";


function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage[]>>({});
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages({});
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage) return;

        setIsGenerating(true);
        setAppState('generating');
        
        const initialImages: Record<string, GeneratedImage[]> = {};
        STYLES.forEach(style => {
            initialImages[style] = [{ status: 'pending' }, { status: 'pending' }];
        });
        setGeneratedImages(initialImages);

        const processVariation = async (style: string, index: number) => {
            try {
                const prompt = getPrompt(style, index + 1); // 1 or 2
                const resultUrl = await generateStyledImage(uploadedImage, prompt);
                setGeneratedImages(prev => {
                    const newImages = [...(prev[style] || [])];
                    newImages[index] = { status: 'done', url: resultUrl };
                    return { ...prev, [style]: newImages };
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                 setGeneratedImages(prev => {
                    const newImages = [...(prev[style] || [])];
                    newImages[index] = { status: 'error', error: errorMessage };
                    return { ...prev, [style]: newImages };
                });
                console.error(`Failed to generate image for ${style} variation ${index + 1}:`, err);
            }
        };

        const generationPromises = STYLES.flatMap(style => 
            [0, 1].map(index => processVariation(style, index))
        );

        await Promise.all(generationPromises);

        setIsGenerating(false);
        setAppState('results-shown');
    };

    const handleRegenerateStyle = async (style: string, index: number) => {
        if (!uploadedImage || generatedImages[style]?.[index]?.status === 'pending') return;
        
        setGeneratedImages(prev => {
            const newImages = [...prev[style]];
            newImages[index] = { status: 'pending' };
            return { ...prev, [style]: newImages };
        });

        try {
            const prompt = getPrompt(style, index + 1);
            const resultUrl = await generateStyledImage(uploadedImage, prompt);
             setGeneratedImages(prev => {
                const newImages = [...prev[style]];
                newImages[index] = { status: 'done', url: resultUrl };
                return { ...prev, [style]: newImages };
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
             setGeneratedImages(prev => {
                const newImages = [...prev[style]];
                newImages[index] = { status: 'error', error: errorMessage };
                return { ...prev, [style]: newImages };
            });
            console.error(`Failed to regenerate image for ${style} variation ${index + 1}:`, err);
        }
    };
    
    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages({});
        setAppState('idle');
    };

    const handleDownloadIndividualImage = (style: string, index: number) => {
        const image = generatedImages[style]?.[index];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `faceframe-${style.toLowerCase()}-var${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadAll = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .flatMap(([style, images]) =>
                    (images as GeneratedImage[]).map((image, index) => ({
                        key: `${style}_${index + 1}`,
                        image,
                    }))
                )
                .filter(({ image }) => image.status === 'done' && image.url)
                .reduce((acc, { key, image }) => {
                    acc[key] = image.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < STYLES.length * 2) {
                alert("Please wait for all images to finish generating before downloading.");
                return;
            }

            const albumDataUrl = await createAlbumPage(imageData);
            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'faceframe-collection.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download collection:", error);
            alert("Sorry, there was an error creating your image collection. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="text-neutral-800 min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center flex-1">
                <header className="text-center my-8 md:my-12">
                    <h1 className="text-5xl md:text-6xl font-bold text-neutral-900">FaceFrame</h1>
                    <p className="text-neutral-500 mt-2 text-lg">Craft your perfect profile picture.</p>
                </header>

                <AnimatePresence mode="wait">
                    {appState === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="w-full max-w-md"
                        >
                            <label htmlFor="file-upload" className="cursor-pointer group flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-neutral-300 rounded-2xl bg-white hover:bg-neutral-50 transition-colors duration-300">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-neutral-500 group-hover:text-blue-600 transition-colors duration-300">
                                    <UploadCloud className="w-10 h-10 mb-4" />
                                    <p className="mb-2 text-lg"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-sm text-neutral-400">PNG, JPG or WEBP</p>
                                </div>
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                        </motion.div>
                    )}

                    {appState === 'image-uploaded' && uploadedImage && (
                        <motion.div
                            key="uploaded"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="flex flex-col items-center gap-8 w-full max-w-md"
                        >
                            <img src={uploadedImage} alt="Uploaded preview" className="rounded-2xl shadow-lg w-64 h-64 object-cover" />
                             <div className="flex items-center gap-4">
                                <button onClick={handleReset} className={secondaryButtonClasses}>
                                    Change Photo
                                </button>
                                <button onClick={handleGenerateClick} className={primaryButtonClasses}>
                                    Generate
                                </button>
                             </div>
                        </motion.div>
                    )}

                    {(appState === 'generating' || appState === 'results-shown') && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="w-full flex flex-col items-center gap-8"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                                {STYLES.map(style => (
                                    <ProfileCard
                                        key={style}
                                        styleName={style}
                                        images={generatedImages[style] || [{ status: 'pending' }, { status: 'pending' }]}
                                        onRegenerate={appState === 'results-shown' ? handleRegenerateStyle : undefined}
                                        onDownload={handleDownloadIndividualImage}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                                <button onClick={handleReset} className={secondaryButtonClasses} disabled={isGenerating}>
                                    Start Over
                                </button>
                                <button
                                    onClick={handleDownloadAll}
                                    className={primaryButtonClasses}
                                    disabled={isGenerating || isDownloading || Object.values(generatedImages).flat().some(img => (img as GeneratedImage).status !== 'done')}
                                >
                                    {isDownloading ? 'Downloading...' : 'Download All'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <Footer />
        </main>
    );
}

// Simple icon components for the UI
const UploadCloud = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>
    </svg>
);


export default App;