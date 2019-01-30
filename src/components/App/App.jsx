import React from "react";
import { CustomScrollbar } from "../CustomScrollbar/CustomScrollbar";
import { StaticContent } from "../StaticContent/StaticContent";
import { DynamicComponent } from "../DynamicComponent/DynamicComponent";

import "./App.scss";

const App = () => {
    return (
        <div className="scaffold">
            <CustomScrollbar
                scrollableContainerClass="scrollable-contentainer--padded"
                scrollBarClass="scrollbar--colored"
                scrollThumbClass="scrollbar__thumb-container__thumb--colored">
                <StaticContent />
            </CustomScrollbar>
            <DynamicComponent />
        </div>
    );
}

export { App };