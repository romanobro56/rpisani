import { Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start"

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>Roman Pisani - Web Developer</Title>
        <Meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <Meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta charset="utf-8" />
        <Meta name="description" content="Roman is a professional web developer and student at the University Of Massachusetts Amherst." />
        <Meta name="keywords" content="Web Developer, React, NextJS, MongoDB, NodeJS, JavaScript, TypeScript, SolidJS, HTML, CSS, Python, Java, C++, Tailwind, Git, VSCode, University of Massachusetts Amherst, UMass" />
        <Meta name="author" content="Roman Pisani" />

        <Meta property="og:title" content="Your Name - Web Developer" />
        <Meta property="og:description" content="Professional web developer specializing in [Your Skills]." />
        <Meta property="og:image" content="https://media.licdn.com/dms/image/D4D03AQH8X3XzN7w97Q/profile-displayphoto-shrink_400_400/0/1695224793698?e=1708560000&v=beta&t=Fp1UPNMpogYsID5rcR23QoBFcZotOVyAj6PrszSfYgY" />
        <Meta property="og:url" content="http://www.rpisani.dev/" />
        <Meta property="og:type" content="website" />

        <Meta name="twitter:card" content="summary_large_image" />
        <Meta name="twitter:title" content="Roman Pisani - Web Developer" />
        <Meta name="twitter:description" content="Professional web developer and student at the University Of Massachusetts Amherst." />
        <Meta name="twitter:image" content="https://media.licdn.com/dms/image/D4D03AQH8X3XzN7w97Q/profile-displayphoto-shrink_400_400/0/1695224793698?e=1708560000&v=beta&t=Fp1UPNMpogYsID5rcR23QoBFcZotOVyAj6PrszSfYgY" />

        <link rel="icon" type="image/x-icon" href="../Monkey.svg" />

      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <Routes>
              <FileRoutes />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
