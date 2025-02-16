import classNames from "classnames"
import { Rubik } from 'next/font/google'
import Link from "next/link";

const rubik = Rubik({ subsets: ['latin'] });

export default function BreadCrumb() {
    return (
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
                <Link id="breadcrumb" href="/" className={"hover:underline"}>Experience</Link>
                <Link id="breadcrumb" href="/software" className={"hover:underline"}>Software</Link>
                <Link id="breadcrumb" href="/creations" className={"hover:underline"}>Creative Works</Link>
            </div>
            <hr className="md:px-[10%]" />
        </div>
    )
}