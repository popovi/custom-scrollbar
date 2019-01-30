import React from "react";
import { CustomScrollbar } from "../CustomScrollbar/CustomScrollbar";
import {DynamicContent} from "./DynamicContent/DynamicContent";
import "./DynamicComponent.scss";
import * as addButton from "../../assets/images/addButton.svg";

class DynamicComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isAddClicked: false,
            contentRowsCount: 0
        }

        this.addButton = React.createRef();

        this.handleAddClick = this.handleAddClick.bind(this);
        this.handleAddAnimationEnd = this.handleAddAnimationEnd.bind(this);
    }

    handleAddClick() {
        this.setState(state => (
            {
                isAddClicked: true,
                contentRowsCount: state.contentRowsCount + 1
            }
        ));
    }

    handleAddAnimationEnd() {
        this.setState({
            isAddClicked: false
        });
    }

    render() {
        const addButtonClickedStyle = this.state.isAddClicked ? "clicked" : "";

        return (
            <div>
                <div style={{ display: "flex" }}>
                    <button className={`actionButton ${addButtonClickedStyle}`} ref={this.addButton} onClick={this.handleAddClick} onAnimationEnd={this.handleAddAnimationEnd}>
                        <img src={addButton} />
                    </button>
                </div>
                <CustomScrollbar scrollBarClass="scrollbar--custom">
                    <DynamicContent rowsCount={this.state.contentRowsCount} />
                </CustomScrollbar>
            </div>
        );
    }
}

export { DynamicComponent }