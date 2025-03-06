import React, { useState } from 'react';
import classNames from 'classnames';
import { GiHamburgerMenu } from 'react-icons/gi';
import { IoMdClose } from "react-icons/io";
import { FiGithub } from "react-icons/fi";
import { TbBrandYoutube } from "react-icons/tb";
import { FaInstagram } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";

function MobileBottomNav() {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        setOpen(!open);
    }

    return (
        <div id="mobile-nav-container" className={classNames(
            "block",
            "md:hidden",
            "fixed bottom-0",
            "flex flex-col",
            "w-full",
            open ? "dark:bg-[#202020]" : "",
        )}>
            <div id="menu-container" className={classNames(
                "flex flex-col",
                "h-[350px]",
                "items-center",
                "justify-around",
                "bg-gray-400",
                "dark:bg-[#202020]",
                "text-[30px]",
                "py-[80px]",
                "rounded-t-3xl",
                "w-full",
                "shadow-[inset_0px_8px_8px_-8px_rgba(255,255,255,1)]",
                "transition-transform duration-200 ease-in-out",
                open ? "translate-y-0" : "translate-y-full",
                "absolute bottom-14",
            )}>
                <a href="/">Experience</a>
                <a href="/software">Software</a>
                <a href="/creations">Creative Works</a>
            </div>

            <div id="nav-btns-container" className={classNames(
                "block",
                "md:hidden",
                "sticky bottom-0",
                "flex",
                "justify-between",
                "items-center",
                "w-full",
                "h-14",
                "px-10",
                "bg-gray-400",
                !open ? "rounded-t-3xl" : "",
                "dark:bg-[#202020]",
            )}>
                <a href="https://github.com/romanobro56" target="_blank" rel="noopener noreferrer">
                    <FiGithub size={40} />
                </a>
                <a href="https://youtube.com/@romanpisani8157" target="_blank" rel="noopener noreferrer">
                    <TbBrandYoutube size={40} />
                </a>
                <button className="mx-4" onClick={toggleOpen}>
                    {open ? <IoMdClose size={45} /> : <GiHamburgerMenu size={45} />}
                </button>
                <a href="https://www.instagram.com/roman.pisani56" target="_blank" rel="noopener noreferrer">
                    <FaInstagram size={40} />
                </a>
                <a href="https://www.linkedin.com/in/roman-pisani" target="_blank" rel="noopener noreferrer">
                    <FaLinkedin size={40} />
                </a>
            </div>
        </div>
    );
}

export default MobileBottomNav;