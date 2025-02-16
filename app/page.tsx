import { Rubik, Sunflower } from 'next/font/google'
import classNames from 'classnames';
import Image from 'next/image';
import Link from 'next/link';

import { FiGithub } from "react-icons/fi";
import { TbBrandYoutube } from "react-icons/tb";
import { FaInstagram, FaLinkedin, FaLastfmSquare, FaKeyboard } from "react-icons/fa";
import { FaSquareLetterboxd } from "react-icons/fa6";

import MobileBottomNav from './components/MobileBottomNav';

import CK_LOGO from '@/app/assets/CK_Logo.webp'
import CK_LOGO_BLACK from '@/app/assets/CK_Logo_Black.webp'
import BUILD_LOGO from '@/app/assets/BUILD_Logo.webp'

const rubik = Rubik({ subsets: ['latin'] });
const sunflower = Sunflower({ weight: "300", subsets: ['latin'] })

export default function Home() {
  return (
    <div id="container">
      <div id="main-container" className={classNames(
        "flex flex-col",
        "pt-9",
        "pl-5",
        "pr-8",
        "pr-5",
        "md:pt-4",
        "md:px-[max(50px,5%)]",
        "md:gap-5",
      )}>
        <div id="breadcrumb-container" className={classNames(
          "hidden",
          "md:flex flex-col",
          "gap-[20px]",
          "text-[30px]",
          "md:px-[10%]",
          "md:mt-10",
        )}>
          <div className={classNames(
            "flex",
            "gap-[20px]",
            rubik.className,
          )}>
            <button id="breadcrumb" className={"hover:underline"}>Experience</button>
            <button id="breadcrumb" className={"hover:underline"}>Software</button>
            <button id="breadcrumb" className={"hover:underline"}>Creative Works</button>
          </div>
          <hr className="md:px-[10%]" />
        </div>
        <div id="header-container" className={classNames(
          "flex justify-between",
          "md:px-[10%]",
          "md:mt-10"
        )}>
          <h1 className={classNames(
            "[font-size:36px]",
            "leading-[36px]",
            rubik.className
          )}>Hi, I'm Roman Pisani</h1>
          <div id="desktop-nav-container" className={classNames(
            "hidden",
            "md:block"
          )}>
            <div id="icons-container" className={classNames(
              "flex flex-col",
              "items-center",
              "gap-4"
            )}>
              <div id="icons-container-top" className={classNames(
                "flex",
                "items-center",
                "[gap:clamp(1rem,2vw,2rem)]",
                "[margin-left:clamp(1rem,4vw,4rem)]"
              )}>
                <Link href="https://www.github.com/romanobro56" rel="noopener noreferrer" target="_blank"><FiGithub size={35} /></Link>
                <Link href="https://www.linkedin.com/in/roman-pisani" rel="noopener noreferrer" target="_blank"><FaLinkedin size={35} /></Link>
                <Link href="https://youtube.com/@romanpisani8157" rel="noopener noreferrer" target="_blank"><TbBrandYoutube size={35} /></Link>
                <Link href="https://www.instagram.com/roman.pisani56" rel="noopener noreferrer" target="_blank"><FaInstagram size={35} /></Link>
              </div>
              <div id="icons-container-bottom" className={classNames(
                "flex",
                "items-center",
                "[gap:clamp(1rem,2vw,2rem)]",
                "[margin-left:clamp(1rem,4vw,4rem)]"
              )}>
                <Link href="https://www.last.fm/user/Romanobro56" rel="noopener noreferrer" target="_blank"><FaLastfmSquare size={35} /></Link>
                <Link href="https://letterboxd.com/romanobro/" rel="noopener noreferrer" target="_blank"><FaSquareLetterboxd size={35} /></Link>
                <Link href="https://monkeytype.com/profile/romanobro" rel="noopener noreferrer" target="_blank"><FaKeyboard size={35} /></Link>
              </div>
            </div>
          </div>
        </div>
        <div id="experience-container" className={classNames(
          "flex flex-col",
          "gap-[40px]",
          "md:mt-8",
          "mb-20",
          "md:px-[10%]",
          rubik.className
        )}>
          { /* Credit Karma */}
          <div id="experience-item" className={classNames(
            "flex",
            "flex-col",
            "w-full",
            "gap-[14px]",
            "md:flex-row",
          )}>
            <div id="experience-date" className={classNames(
              sunflower.className,
              "text-[24px]",
              "md:w-[100px]",
              "md:flex-none"
            )}>May '24 - Aug '24</div>
            <div id="experience-divider" className={classNames(
              "w-full",
              "h-1",
              "bg-[#008601]",
              "rounded-[1px]",
              "md:h-auto",
              "md:w-1",
              "md:min-w-1"
            )}></div>
            <div id="experience-details-container" className="flex flex-col gap-[10px] md:ml-4">
              <div id="experience-header" className="flex items-center">
                <div id="experience-cover" className={classNames(
                  "w-1/3",
                  "min-w-[60px]",
                  "max-w-[100px]",
                  "aspect-ratio-square",
                  "md:max-w-[200px]"
                )}>
                  <Image
                    src={CK_LOGO}
                    alt="Credit Karma Logo"
                    className="w-full h-full hidden dark:block"
                    objectFit="cover"
                  ></Image>
                  <Image
                    src={CK_LOGO_BLACK}
                    alt="Credit Karma Logo"
                    className="w-full h-full dark:hidden"
                    objectFit="cover"
                  ></Image>
                </div>
                <div id="experience-name" className="text-[36px] leading-[36px] ml-[8px]">Intuit Credit Karma</div>
              </div>
              <div id="experience-title" className="text-[28px] font-bold">Software Engineering Intern</div>
              <div id="experience-description" className="text-[28px] max-w-[900px]">I designed and built over 8 cross-platform pages for a new user flow focused on dispute management, adhering to banking security standards</div>
            </div>
          </div>
          { /* BUILD UMass */}
          <div id="experience-item" className={classNames(
            "flex",
            "flex-col",
            "w-full",
            "gap-[14px]",
            "md:flex-row",
          )}>
            <div id="divider" className="flex md:flex-col items-center gap-3">
              <div id="experience-date" className={classNames(
                sunflower.className,
                "text-[24px]",
                "md:w-[100px]",
                "md:flex-none"
              )}>Sep '23 - Present</div>
              <span className={classNames(
                "w-2.5",
                "h-2.5",
                "bg-green-400",
                "rounded-full",
                "inline-block",
                "animate-pulse",
                "shadow-[0_0_8px_#4ade80]"
              )}>
              </span>
            </div>
            <div id="experience-divider" className={classNames(
              "w-full",
              "h-1",
              "bg-[#A40301]",
              "rounded-[1px]",
              "md:h-auto",
              "md:w-1",
              "md:min-w-1"
            )}></div>
            <div id="experience-details-container" className="flex flex-col gap-[10px] md:ml-4">
              <div id="experience-header" className="flex items-center">
                <div id="experience-cover" className={classNames(
                  "w-1/3",
                  "min-w-[60px]",
                  "max-w-[100px]",
                  "aspect-ratio-square",
                  "md:max-w-[200px]"
                )}>
                  <Image
                    src={BUILD_LOGO}
                    alt="BUILD UMass Logo"
                    className="w-full h-full"
                    objectFit="cover"
                  ></Image>
                </div>
                <div id="experience-name" className="text-[36px] leading-[36px] ml-[8px]">BUILD UMass</div>
              </div>
              <div id="experience-title" className="text-[28px] font-bold">Project Lead</div>
              <div id="experience-description" className="text-[28px] max-w-[900px]">I am leading a team towards creating a resource sharing app regarding women's rights in India for Aarti Home</div>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>

  );
}
