import { Component } from "react";
import type { ChangeEvent } from "react";
import "./userKeywords.css";

type UserKeywordsProps = {
  onRenderStateChange?: (isRendering: boolean) => void;
}

type UserKeywordsState = {
  roomType: string;
  roomStyle: string;
  askedToRender: boolean;
}

const roomTypeExamples = ["bedroom", "living room", "dining room", "office", "bathroom", "kitchen"];
const styleExamples = ["cozy", "modern", "minimalist", "gaming", "rustic", "industrial", "open"];

export class UserKeywords extends Component<UserKeywordsProps, UserKeywordsState> {
  constructor(props: UserKeywordsProps) {
    super(props);

    this.state = {
      roomType: "",
      roomStyle: "",
      askedToRender: false
    };
  }

  handleRenderClick = () => {
    this.setState({ askedToRender: true }, () => {
      // Notify parent component about the render state change
      this.props.onRenderStateChange?.(true);
    });
  }

  handleRoomTypeOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ roomType: event.target.value });
  }

  handleRoomStyleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ roomStyle: event.target.value });
  }

  render() {
    const { roomType, roomStyle, askedToRender } = this.state;

    if (askedToRender) {
      return (
        <div className="rendering-message">
          Rendering your {roomStyle} {roomType}...
        </div>
      );
    }

    return (
      <div className="user-keywords-container">
        <div className="input-group">
          <label htmlFor="roomType">What room would you like to design?</label>
          <input
            type="text"
            id="roomType"
            value={roomType}
            onChange={this.handleRoomTypeOnChange}
            placeholder="Enter room type"
            className="keyword-input"
          />
          <div className="examples">
            Examples: {roomTypeExamples.join(", ")}
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="roomStyle">What style would you like for your room?</label>
          <input
            type="text"
            id="roomStyle"
            value={roomStyle}
            onChange={this.handleRoomStyleOnChange}
            placeholder="Enter room style"
            className="keyword-input"
          />
          <div className="examples">
            Examples: {styleExamples.join(", ")}
          </div>
        </div>

        <button
          className="render-button"
          onClick={this.handleRenderClick}
          disabled={!roomType || !roomStyle}
        >
          Render Design
        </button>
      </div>
    );
  }
}