// src/components/PhotoGallery.jsx
import { useState } from "react";
import { ColumnsPhotoAlbum } from "react-photo-album";
import "react-photo-album/columns.css"; // Important to import this for proper columns styling
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import styles from "../styles/PhotoGallery.module.css";

export default function PhotoGallery({ images }) {
  const [index, setIndex] = useState(-1);

  // Custom render function for the lightbox footer/caption
  const renderSlideFooter = ({ slide }) => (
    <div className={styles.caption}>
      <h3 className={styles.title}>{slide.title}</h3>
      <p className={styles.description}>{slide.description}</p>
    </div>
  );

  return (
    <div className="w-full my-8">
      {/* Using ColumnsPhotoAlbum to match the example implementation */}
      <ColumnsPhotoAlbum
        photos={images}
        onClick={({ index }) => setIndex(index)}
        // You can add additional props here as needed
        // spacing={8}
        // padding={0}
        // targetRowHeight={300}
      />
      
      <Lightbox
        slides={images}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        render={{ slideFooter: renderSlideFooter }}
      />
    </div>
  );
}