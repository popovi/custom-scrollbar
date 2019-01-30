import React from "react";
import "./DynamicContent.scss";

class DynamicContent extends React.Component {
    componentDidUpdate() {
        this.props.onResize();
    }

    render() {
        const items = [];
        for (let i = 1; i <= this.props.rowsCount; i++)
            items.push(<div key={i} className="dataRow">{i}</div>);

        return (
            <div className="scrollableItem">
                <div style={{ fontSize: "70%" }}>
                    {items}
                </div>
            </div>
        );

    }
}

export { DynamicContent }