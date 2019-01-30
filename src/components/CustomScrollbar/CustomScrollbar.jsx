import React from "react";
import ReactDOM from "react-dom";

import "./CustomScrollbar.scss";

class CustomScrollbar extends React.Component {
    constructor(props) {
        super(props);

        this.topContainer = null;

        this.scrollBarProps = {
            vertScrollContainer: null,          // контейнер, в котором будет происходить сама прокрутка
            vertScrollThumbElement: null,       // DOM-элемент scrollThumb
            vertScrollThumbClientRect: null,    // прямоугольник с координатами для scrollThumb относительно window
            vertScrollBarElement: null,         // DOM-элемент scrollBar
            vertScrollBarHeight: 0,             // высота всего скролбара
            vertRowHeight: 0,                   // высота для прокрутки одной строки
            vertThumbHeight: 0,                 // высота бегунка
            vertPagesCount: 0,                  // количество страничных прокруток
            vertRowsCount: 0,                   // количество минимальных прокруток
            vertRowsPerPage: 0,                 // максимальное количество строк в странице (если ещё есть)
            vertThumbPositions: [],             // реперные точки при смещении scrollThumb на одну строку
            vertThumbCurrentPosIndex: 0,        // текущее значение top для scrollThumb
            vertScrollTopPositionsArr: [],      // реперные точки для контента при его прокрутке на одну строку
            vertIsMouseScrollReady: false,      // нажата кнопка мыши над scrollThumb и при её движении будет прокрутка
            vertMouseScrollStartPosition: 0,    // начальная верхняя точка при mousemove
        };

        this.handleResize = this.handleResize.bind(this);
        this.scrollThumbMouseDown = this.scrollThumbMouseDown.bind(this);
        this.documentBodyMouseUp = this.documentBodyMouseUp.bind(this);
        this.documentBodyMouseMove = this.documentBodyMouseMove.bind(this);
        this.scrollBarMouseDown = this.scrollBarMouseDown.bind(this);
        this.contentMouseWheel = this.contentMouseWheel.bind(this);
        this.contentMouseEnter = this.contentMouseEnter.bind(this);
        this.contentMouseLeave = this.contentMouseLeave.bind(this);
        this.contentKeydown = this.contentKeydown.bind(this);
    }

    /////////////////////////////////
    // Lifecircles

    componentDidMount() {
        this.topContainer = ReactDOM.findDOMNode(this);

        // если дочерний элемент не DOM-элемент, то ничего не делаем
        if ((!this.topContainer) || (this.topContainer.nodeType != 1))
            return;

        const firstChild = this.topContainer.firstChild;
        const scrollableContainer = this.getNewScrollableContentainer();

        scrollableContainer.insertBefore(firstChild, null);
        this.topContainer.insertBefore(scrollableContainer, this.topContainer.firstChild);
        this.topContainer.insertAdjacentHTML("beforeEnd", this.getNewScrollBarHTML());

        this.setInitials();
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.handleResize);

        document.body.removeEventListener("mouseup", this.documentBodyMouseUp);
        document.body.removeEventListener("mousemove", this.documentBodyMouseMove);
    }
    /////////////////////////////////

    render() {
        const children = React.Children.toArray(this.props.children);

        if(React.Children.count(children) > 1)
            throw new Error("Child component must be the only.");

        const childComponent = children[0];

        return React.cloneElement(
            childComponent,
            {
                onResize: this.handleResize
            },
            null
        );
    }

    /////////////////////////////////
    // Services

    getNewScrollableContentainer() {
        const { scrollableContainerClass } = this.props;

        const scrollableContentainer = document.createElement("div");
        scrollableContentainer.className = `scrollable-contentainer ${scrollableContainerClass}`;

        return scrollableContentainer;
    }

    getNewScrollBarHTML() {
        const { scrollBarClass, scrollThumbClass } = this.props;

        const scrollBarHTML = `<div class="scrollbar ${scrollBarClass}">
                                    <div class="scrollbar__thumb-container">
                                        <div class="scrollbar__thumb-container__thumb ${scrollThumbClass}"></div>
                                    </div>
                                </div>`;
        return scrollBarHTML;
    }

    setInitials() {
        this.scrollBarProps.vertScrollContainer = this.topContainer.firstElementChild;
        this.scrollBarProps.vertScrollBarElement = this.topContainer.children[1];
        this.scrollBarProps.vertScrollThumbElement = this.scrollBarProps.vertScrollBarElement.firstElementChild;

        // сколько минимальных прокруток (по одному нажатию мыши или кнопки "вверх/вниз")
        // минимальной будем считать прокрутку на 0.1em
        // узнаем эту высоту в пикселях (в 1em) для элемента vertScrollContainer
        const tempDiv = document.createElement("div");
        tempDiv.textContent = "I";
        tempDiv.style.visibility = "hidden";

        this.scrollBarProps.vertScrollContainer.appendChild(tempDiv);
        this.scrollBarProps.vertRowHeight = tempDiv.scrollHeight / 10;
        this.scrollBarProps.vertScrollContainer.removeChild(tempDiv);
        //

        this.setDimensions();

        window.addEventListener("resize", this.handleResize);

        // обработчики событий для мыши
        this.scrollBarProps.vertScrollThumbElement.addEventListener("mousedown", this.scrollThumbMouseDown);
        this.scrollBarProps.vertScrollThumbElement.addEventListener("mouseup", this.scrollThumbMouseUp);
        this.scrollBarProps.vertScrollThumbElement.addEventListener("selectstart", evt => { evt.preventDefault(); });
        this.scrollBarProps.vertScrollBarElement.addEventListener("mousedown", this.scrollBarMouseDown);
        this.topContainer.addEventListener("wheel", this.contentMouseWheel);
        this.topContainer.addEventListener("mouseenter", this.contentMouseEnter);
        this.topContainer.addEventListener("mouseleave", this.contentMouseLeave);
        document.body.addEventListener("mouseup", this.documentBodyMouseUp);
        document.body.addEventListener("mousemove", this.documentBodyMouseMove);
        //

        // обработчики событий для клавиатуры
        this.topContainer.addEventListener("keydown", this.contentKeydown);
        //
    }

    setDimensions() {
        this.scrollBarProps.vertScrollBarHeight = this.topContainer.clientHeight;

        //--

        const thumbHeight = (this.scrollBarProps.vertScrollContainer.clientHeight / this.scrollBarProps.vertScrollContainer.scrollHeight) * this.scrollBarProps.vertScrollBarHeight;
        this.scrollBarProps.vertThumbHeight = Math.round(thumbHeight * 10) / 10;
        if(this.scrollBarProps.vertThumbHeight < this.scrollBarProps.vertScrollBarHeight)
            this.scrollBarProps.vertScrollThumbElement.style.height = this.scrollBarProps.vertThumbHeight + "px";

        this.scrollBarProps.vertPagesCount = Math.ceil(this.scrollBarProps.vertScrollContainer.scrollHeight / this.scrollBarProps.vertScrollContainer.clientHeight);

        //--

        this.scrollBarProps.vertRowsCount = Math.ceil(this.scrollBarProps.vertScrollContainer.scrollHeight / this.scrollBarProps.vertRowHeight);

        //--

        // разбиваем высоту scrollBar на vertRowsCount частей
        // отслеживаем положение верха!!! thumbBar
        const thumbPositionsArr = [];
        let minPosition = 0;
        let maxPosition = this.scrollBarProps.vertScrollBarHeight - this.scrollBarProps.vertThumbHeight;  // учитываем высоту самого scrollThumb
        let gap = maxPosition - minPosition;

        thumbPositionsArr.push(minPosition);
        for (let i = 1; i < this.scrollBarProps.vertRowsCount - 1; i++) {
            // вычисляем отступ сверху для scrollThumb для каждой позиции
            thumbPositionsArr.push(minPosition + i * (gap / (this.scrollBarProps.vertRowsCount - 1)));
        }
        thumbPositionsArr.push(maxPosition);

        this.scrollBarProps.vertThumbPositions = thumbPositionsArr;
        //

        //--

        // расчитаем значения самой прокрутки для контента для каждой позиции scrollThumb
        const scrollTopPositionsArr = [];
        minPosition = 0;
        maxPosition = this.scrollBarProps.vertScrollContainer.scrollHeight - this.scrollBarProps.vertScrollContainer.clientHeight;
        gap = maxPosition - minPosition;

        scrollTopPositionsArr.push(minPosition);
        for (let i = 1; i < this.scrollBarProps.vertRowsCount - 1; i++) {
            scrollTopPositionsArr.push(minPosition + i * (gap / (this.scrollBarProps.vertRowsCount - 1)));
        }
        scrollTopPositionsArr.push(maxPosition);

        this.scrollBarProps.vertScrollTopPositionsArr = scrollTopPositionsArr;
        //

        //--

        this.scrollBarProps.vertRowsPerPage = Math.ceil(this.scrollBarProps.vertRowsCount / this.scrollBarProps.vertPagesCount);

        this.scrollBarProps.vertScrollThumbClientRect = this.scrollBarProps.vertScrollThumbElement.getBoundingClientRect();
    }

    handleResize() {
        this.setDimensions();
    }

    scrollThumbMouseDown(evt) {
        evt.preventDefault();

        this.scrollBarProps.vertIsMouseScrollReady = true;

        this.scrollBarProps.vertMouseScrollStartPosition = evt.clientY;
        this.scrollBarProps.vertMouseScrollStopPosition = 0;
    }

    documentBodyMouseUp() {
        if (this.scrollBarProps.vertIsMouseScrollReady) {
            this.scrollBarProps.vertIsMouseScrollReady = false;

            this.scrollBarProps.vertMouseScrollStartPosition = 0;
            this.scrollBarProps.vertMouseScrollStopPosition = 0;

            this.scrollBarProps.vertScrollThumbClientRect = this.scrollBarProps.vertScrollThumbElement.getBoundingClientRect();
        }
    }

    documentBodyMouseMove(evt) {
        if (this.scrollBarProps.vertIsMouseScrollReady) {
            const currentThumbTopPosition = this.scrollBarProps.vertThumbPositions[this.scrollBarProps.vertThumbCurrentPosIndex];
            const nextThumbTopPosition = currentThumbTopPosition + (evt.clientY - this.scrollBarProps.vertMouseScrollStartPosition);

            this.moveArbitraryUpDown(nextThumbTopPosition, evt.clientY);
        }
    }

    scrollBarMouseDown(evt) {
        evt.preventDefault();   // чтобы при частом нажатии не получилось dblclick и не происходило выделения контента

        if (this.scrollBarProps.vertIsMouseScrollReady)
            return;

        if (evt.clientY > this.scrollBarProps.vertScrollThumbClientRect.bottom) {
            this.movePageDown();
        }
        else if (evt.clientY < this.scrollBarProps.vertScrollThumbClientRect.top) {
            this.movePageUp();
        }
    }

    contentMouseWheel(evt) {
        evt.preventDefault();

        const currentThumbTopPosition = this.scrollBarProps.vertThumbPositions[this.scrollBarProps.vertThumbCurrentPosIndex];
        // двигаем на одну строку
        const nextThumbTopPosition = currentThumbTopPosition + (evt.deltaY > 0 ? this.scrollBarProps.vertRowHeight : -this.scrollBarProps.vertRowHeight);

        this.moveArbitraryUpDown(nextThumbTopPosition, nextThumbTopPosition);
    }

    contentMouseEnter() {
        this.scrollBarProps.vertScrollBarElement.classList.add("active");
    }

    contentMouseLeave() {
        this.scrollBarProps.vertScrollBarElement.classList.remove("active");
    }

    contentKeydown(evt){
        if ((evt.keyCode == 40) || (evt.keyCode == 38) || (evt.keyCode == 34) || (evt.keyCode == 33)) {

            evt.preventDefault();
            
            if ((evt.keyCode == 40) || (evt.keyCode == 38)) {   // двигаем на одну строку
                const currentTopPosition = this.scrollBarProps.vertThumbPositions[this.scrollBarProps.vertThumbCurrentPosIndex];
                let nextTopPosition;

                if (evt.keyCode == 40)  // вниз
                    nextTopPosition = currentTopPosition + this.scrollBarProps.vertRowHeight;
                if (evt.keyCode == 38)  // вверх
                    nextTopPosition = currentTopPosition - this.scrollBarProps.vertRowHeight;

                this.moveArbitraryUpDown(nextTopPosition, nextTopPosition);
            }
            else {  // двигаем на одну страницу
                if (evt.keyCode == 34)  // вниз
                    this.movePageDown();
                if (evt.keyCode == 33)  // вверх
                    this.movePageUp();
            }
        }
    }

    ///////////////////
    // Moving

    movePageDown() {
        let nextIndex;

        if (this.scrollBarProps.vertThumbCurrentPosIndex < this.scrollBarProps.vertRowsCount - this.scrollBarProps.vertRowsPerPage)
            nextIndex = this.scrollBarProps.vertThumbCurrentPosIndex + this.scrollBarProps.vertRowsPerPage;
        else
            nextIndex = this.scrollBarProps.vertRowsCount - 1;

        this.animate({
            duration: 200,
            timing: this.timing,
            scrollContainer: this.scrollBarProps.vertScrollContainer,
            vertStartPosition: this.scrollBarProps.vertScrollTopPositionsArr[this.scrollBarProps.vertThumbCurrentPosIndex],
            vertStopPosition: this.scrollBarProps.vertScrollTopPositionsArr[nextIndex],
            draw: this.drawVert
        });

        this.scrollBarProps.vertThumbCurrentPosIndex = nextIndex;
        this.scrollBarProps.vertScrollThumbElement.style.top = this.scrollBarProps.vertThumbPositions[this.scrollBarProps.vertThumbCurrentPosIndex] + "px";
        // this.scrollBarProps.vertScrollContainer.scrollTop = this.scrollBarProps.vertScrollTopPositionsArr[this.scrollBarProps.vertThumbCurrentPosIndex];

        this.scrollBarProps.vertScrollThumbClientRect = this.scrollBarProps.vertScrollThumbElement.getBoundingClientRect();
    }

    movePageUp() {
        let nextIndex;

        if (this.scrollBarProps.vertThumbCurrentPosIndex >= this.scrollBarProps.vertRowsPerPage)
            nextIndex = this.scrollBarProps.vertThumbCurrentPosIndex - this.scrollBarProps.vertRowsPerPage;
        else
            nextIndex = 0;

        this.animate({
            duration: 200,
            timing: this.timing,
            scrollContainer: this.scrollBarProps.vertScrollContainer,
            vertStartPosition: this.scrollBarProps.vertScrollTopPositionsArr[this.scrollBarProps.vertThumbCurrentPosIndex],
            vertStopPosition: this.scrollBarProps.vertScrollTopPositionsArr[nextIndex],
            draw: this.drawVert
        });

        this.scrollBarProps.vertThumbCurrentPosIndex = nextIndex;
        this.scrollBarProps.vertScrollThumbElement.style.top = this.scrollBarProps.vertThumbPositions[this.scrollBarProps.vertThumbCurrentPosIndex] + "px";
        // this.scrollBarProps.vertScrollContainer.scrollTop = this.scrollBarProps.vertScrollTopPositionsArr[this.scrollBarProps.vertThumbCurrentPosIndex];

        this.scrollBarProps.vertScrollThumbClientRect = this.scrollBarProps.vertScrollThumbElement.getBoundingClientRect();
    }

    moveArbitraryUpDown(nextThumbTopPosition, nextVertMouseScrollStartPosition) {
        // определим следующую ближайшую к nextTopPosition точку в this.scrollBarProps.vertThumbPositions
        var nextIndex = -1;
        if (nextThumbTopPosition < 0)
            nextIndex = 0;
        else if (nextThumbTopPosition > this.scrollBarProps.vertThumbPositions[this.scrollBarProps.vertThumbPositions.length - 1])
            nextIndex = this.scrollBarProps.vertThumbPositions.length - 1;
        else {
            let delta = 0;

            const startSearchIndex = this.scrollBarProps.vertThumbCurrentPosIndex;
            if (nextThumbTopPosition > this.scrollBarProps.vertThumbPositions[this.scrollBarProps.vertThumbCurrentPosIndex]) {
                // scrollThumb двигаем вниз
                for (let i = startSearchIndex; i < this.scrollBarProps.vertThumbPositions.length; i++) {
                    delta = Math.abs(this.scrollBarProps.vertThumbPositions[i] - nextThumbTopPosition);
                    if (delta <= 0.5) {
                        nextIndex = i;
                        break;
                    }
                }
                if (nextIndex != -1) {  // продолжим сканирование на предмет более точной позиции
                    for (let i = nextIndex + 1; i < this.scrollBarProps.vertThumbPositions.length; i++) {
                        const tempDelta = Math.abs(this.scrollBarProps.vertThumbPositions[i] - nextThumbTopPosition);
                        if (tempDelta < delta) {
                            nextIndex = i;
                            delta = tempDelta;
                        }
                        else
                            break;
                    }
                }
            }
            else {
                // scrollThumb двигаем вверх
                for (let i = startSearchIndex; i >= 0; i--) {
                    delta = Math.abs(this.scrollBarProps.vertThumbPositions[i] - nextThumbTopPosition);
                    if (delta <= 0.5) {
                        nextIndex = i;
                        break;
                    }
                }
                if (nextIndex != -1) {  // продолжим сканирование на предмет более точной позиции
                    for (let i = nextIndex - 1; i >= 0; i--) {
                        const tempDelta = Math.abs(this.scrollBarProps.vertThumbPositions[i] - nextThumbTopPosition);
                        if (tempDelta < delta) {
                            nextIndex = i;
                            delta = tempDelta;
                        }
                        else
                            break;
                    }
                }
            }
        }
        //

        if ((nextIndex != -1) && (nextIndex != this.scrollBarProps.vertThumbCurrentPosIndex)) {
            this.animate({
                duration: 100,
                timing: this.timing,
                scrollContainer: this.scrollBarProps.vertScrollContainer,
                vertStartPosition: this.scrollBarProps.vertScrollTopPositionsArr[this.scrollBarProps.vertThumbCurrentPosIndex],
                vertStopPosition: this.scrollBarProps.vertScrollTopPositionsArr[nextIndex],
                draw: this.drawVert
            });

            this.scrollBarProps.vertThumbCurrentPosIndex = nextIndex;
            this.scrollBarProps.vertMouseScrollStartPosition = nextVertMouseScrollStartPosition;

            this.scrollBarProps.vertScrollThumbElement.style.top = this.scrollBarProps.vertThumbPositions[this.scrollBarProps.vertThumbCurrentPosIndex] + "px";
            // this.scrollBarProps.vertScrollContainer.scrollTop = this.scrollBarProps.vertScrollTopPositionsArr[this.scrollBarProps.vertThumbCurrentPosIndex];
        }
    }
    ///////////////////
    /////////////////////////////////


    ///////////////////
    // Helpers

    animate(options) {
        const start = performance.now();

        const drawOptions = {
            scrollContainer: options.scrollContainer,
            vertStartPosition: options.vertStartPosition,
            vertStopPosition: options.vertStopPosition
        };

        let rafId = requestAnimationFrame(function animateFrame(time) {
            // timeFraction от 0 до 1
            let timeFraction = (time - start) / options.duration;
            if (timeFraction > 1)
                timeFraction = 1;

            // текущее состояние анимации
            let progress = options.timing(timeFraction);

            options.draw(progress, drawOptions);

            if (timeFraction == 1)
                cancelAnimationFrame(rafId);
            else
                rafId = requestAnimationFrame(animateFrame);
        });
    }

    timing(timeFraction) {
        return timeFraction;    // white star linear
    }

    drawVert(progressPart, drawOptions) {
        let gap = progressPart * (drawOptions.vertStopPosition - drawOptions.vertStartPosition);

        if (Math.abs(gap) > Math.abs(drawOptions.vertStopPosition - drawOptions.vertStartPosition))
            gap = drawOptions.vertStopPosition - drawOptions.vertStartPosition;

        drawOptions.scrollContainer.scrollTop = drawOptions.vertStartPosition + gap;
    }
    ///////////////////
}

export { CustomScrollbar }