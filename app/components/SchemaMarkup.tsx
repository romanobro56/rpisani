import Script from "next/script";

export default function SchemaMarkup() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Roman Pisani",
    "jobTitle": "Software Engineer",
    "url": "https://yourdomain.com",
    "sameAs": [
      "https://github.com/yourusername",
      "https://linkedin.com/in/yourusername"
    ]
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
