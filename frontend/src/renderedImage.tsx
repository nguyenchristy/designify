import React, { Component, type JSX } from "react";
import './renderedImage.css';

type RenderedImageProps = {
    // The image name is fixed as 'renderedImage.jpeg' in the backend
    imageId?: string;  // Optional in case you need to handle different image IDs in the future
    onImageLoad?: () => void;
    onError?: (error: string) => void;
}

type RenderedImageState = {
    isLoading: boolean;
    error: string | null;
    hasLoaded: boolean;
}

export class RenderedImage extends Component<RenderedImageProps, RenderedImageState> {
    private imageUrl: string;

    constructor(props: RenderedImageProps) {
        super(props);
        
        // Construct the URL to match your backend server
        this.imageUrl = 'http://localhost:3000/images/renderedImage.jpeg';
        
        this.state = {
            isLoading: true,
            error: null,
            hasLoaded: false
        };
    }

    handleImageLoad = () => {
        this.setState({ 
            isLoading: false,
            hasLoaded: true 
        });
        this.props.onImageLoad?.();
    };

    handleImageError = () => {
        this.setState({ 
            isLoading: false,
            error: "Failed to load rendered image",
            hasLoaded: false
        });
        this.props.onError?.("Failed to load rendered image");
    };

    render(): JSX.Element {
        const { isLoading, error, hasLoaded } = this.state;

        return (
            <div className="rendered-image-container">
                {isLoading && (
                    <div className="loading-overlay">
                        <span>Loading rendered image...</span>
                    </div>
                )}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                <img
                    src={this.imageUrl}
                    alt="Rendered room design"
                    className="rendered-image"
                    onLoad={this.handleImageLoad}
                    onError={this.handleImageError}
                    style={{
                        display: hasLoaded ? 'block' : 'none',
                        maxWidth: '100%',
                        height: 'auto'
                    }}
                />
            </div>
        );
    }
}