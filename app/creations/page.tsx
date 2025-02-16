import BreadCrumb from "../components/BreadCrumb"
import classNames from "classnames"

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

                <BreadCrumb />
                <div id="content-container" className={"p-[10%] text-3xl"}>
                    Under Construction
                </div>
            </div>
        </div>
    )
}  