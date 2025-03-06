import { useState, useCallback } from "react";
import MasonryPhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import classNames from "classnames";

// Custom styles for the lightbox description
import styles from "../styles/PhotoGallery.module.css"

export default function PhotoGallery({ images }) {
    const [index, setIndex] = useState(-1);

    // Convert our images to the format expected by react-photo-album
    const photos = images.map((image) => ({
        src: image.src,
        width: image.width,
        height: image.height,
        alt: image.alt,
    }));

    // Prepare slides for the lightbox with our custom render function
    const slides = images.map((image) => ({
        src: image.src,
        width: image.width,
        height: image.height,
        alt: image.alt,
        title: image.title,
        description: image.description,
    }));

    // Custom render function for the photo album

    const renderPhoto = useCallback(({ photo, imageProps }) => {
        // Force a maximum width with inline styles that will override any other styles
        return (
            <div className={styles.photoWrapper} style={{ maxWidth: "400px", margin: "0 auto" }}>
                <div className={styles.photoContainer} style={{ maxWidth: "100%" }}>
                    <img
                        src={photo.src}
                        alt={photo.alt || "Photo"}
                        className={styles.galleryImage}
                        style={{
                            ...imageProps.style,
                            maxWidth: "100%",
                            width: "auto", // Override any width settings
                            height: "auto", // Maintain aspect ratio
                        }}
                    />
                    {photo.title && <div className={styles.photoTitle}>{photo.title}</div>}
                </div>
            </div>
        );
    }, []);

    // Custom render function for the lightbox footer/caption
    const renderSlideFooter = useCallback(({ slide }) => {
        return (
            <div className={styles.caption}>
                <h3 className={styles.title}>{slide.title}</h3>
                <p className={styles.description}>{slide.description}</p>
            </div>
        );
    }, []);

    return (
        <div className={classNames("w-full", "my-8")}>
            <MasonryPhotoAlbum
                photos={photos}
                layout="masonry"
                spacing={12}
                columnWidth={400} // Force column width
                columns={(containerWidth) => {
                    if (containerWidth < 640) return 2;
                    if (containerWidth < 1024) return 3;
                    return 4;
                }}
                onClick={({ index }) => setIndex(index)}
                renderPhoto={renderPhoto}
            />
            <Lightbox
                slides={slides}
                open={index >= 0}
                index={index}
                close={() => setIndex(-1)}
                render={{ slideFooter: renderSlideFooter }}
            />
        </div>
    );
}