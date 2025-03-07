// src/data/gallery-images.js
const breakpoints = [1080, 640, 384, 256, 128, 96, 64, 48];

export const galleryImages = [
    {
        src: "/gallery/Knight.jpg",
        width: 3024,
        height: 4032,
        title: "knighted",
        description: "Location: 42.056698, -71.329452",
        alt: "knighted"
    },
    {
        src: "/gallery/portrait.png",
        width: 404,
        height: 410,
        title: "An image of myself",
        description: "Location: 42.394186, -72.526809",
        alt: "me"
    },
    {
        src: "/gallery/Mask.png",
        width: 708,
        height: 768,
        title: "Evil",
        description: "Location: unknown",
        alt: "evil"
    },
    {
        src: "/gallery/Manny.png",
        width: 1200,
        height: 1323,
        title: "Manny:",
        description: "Location: ",
        alt: "evil"
    },

].map(
    ({ src, width, height, title, description, alt }) => ({
        // These properties are required for react-photo-album
        src,
        alt,
        width,
        height,
        // This creates responsive image sources for different screen sizes
        srcSet: breakpoints.map((breakpoint) => ({
            src,
            width: breakpoint,
            height: Math.round((height / width) * breakpoint),
        })),
        // These additional properties are used by the lightbox
        title,
        description
    })
);