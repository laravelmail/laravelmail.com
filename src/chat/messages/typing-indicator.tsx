import MessageType from "./messagetype";

export default class TypingIndicator extends MessageType {

    render() {
        const containerStyle = {
            width: '100%',
            maxWidth: '75%',
            margin: '8px auto',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #59079E 0%, #4b1e4e 100%)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(194, 112, 200, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50px'
        };

        const dotsContainerStyle = {
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
        };

        const dotStyle = {
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #C270C8 0%, #B42583 100%)',
            animation: 'bounce 1.4s infinite ease-in-out both',
            boxShadow: '0 2px 4px rgba(194, 112, 200, 0.3)'
        };

        return this.state.visible ? (
            <div style={containerStyle}>
                <style>{`
                    @keyframes bounce {
                        0%, 80%, 100% {
                            transform: scale(0.8);
                            opacity: 0.5;
                        }
                        40% {
                            transform: scale(1.2);
                            opacity: 1;
                        }
                    }
                `}</style>
                <div style={dotsContainerStyle}>
                    <span
                        className="dot"
                        style={{
                            ...dotStyle,
                            animationDelay: '0s'
                        }}
                    ></span>
                    <span
                        className="dot"
                        style={{
                            ...dotStyle,
                            animationDelay: '0.2s'
                        }}
                    ></span>
                    <span
                        className="dot"
                        style={{
                            ...dotStyle,
                            animationDelay: '0.4s'
                        }}
                    ></span>
                </div>
            </div>
        ) : null;
    }

    onVisibilityChange = () => {
        this.setState({ visible: true })
        setTimeout(() => {
            this.setState({ visible : false, visibilityChanged: true});
            this.props.onVisibilityChange(this.props.message, this.state);
        }, this?.props?.message?.timeout ? this.props.message.timeout * 1000 : 0);
    };
}
