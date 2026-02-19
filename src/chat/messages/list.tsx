import { botman } from '../botman';
import MessageType from "./messagetype";
import type { IButton, IMessage, IMessageTypeProps } from '../../typings';

export default class ListType extends MessageType {

    getButton(button: IButton) {
        const buttonStyle = {
            background: 'linear-gradient(135deg, #C270C8 0%, #B42583 100%)',
            color: '#eaeaea',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(194, 112, 200, 0.3)',
            textDecoration: 'none',
            display: 'inline-block',
            marginTop: '8px'
        };

        if (button.type === 'postback') {
            return (
                <div
                    class="btn"
                    style={buttonStyle}
                    onClick={() => this.performAction(button)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(194, 112, 200, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(194, 112, 200, 0.3)';
                    }}
                >
                    {button.title}
                </div>
            );
        }
        if (button.type === 'web_url') {
            return (
                <a
                    class="btn"
                    href={button.url}
                    target="_blank"
                    style={buttonStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(194, 112, 200, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(194, 112, 200, 0.3)';
                    }}
                >
                    {button.title}
                </a>
            );
        }
    }

    render(props: IMessageTypeProps) {
        const message = props.message;

        const containerStyle = {
            width: '100%',
            maxWidth: '75%',
            margin: '0 auto',
            padding: '16px'
        };

        const scrollContainerStyle = {
            overflowX: 'auto' as const,
            overflowY: 'hidden' as const,
            display: 'flex',
            gap: '16px',
            padding: '8px 0',
            marginBottom: '16px',
            scrollbarWidth: 'thin' as const,
            scrollbarColor: '#C270C8 #4b1e4e'
        };

        const cardStyle = {
            minWidth: '220px',
            maxWidth: '280px',
            background: 'linear-gradient(135deg, #59079E 0%, #4b1e4e 100%)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(194, 112, 200, 0.2)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            flexShrink: 0
        };

        const imageStyle = {
            width: '100%',
            borderRadius: '8px',
            marginBottom: '12px',
            objectFit: 'cover' as const,
            maxHeight: '160px'
        };

        const titleStyle = {
            color: '#eaeaea',
            fontSize: '1.1rem',
            fontWeight: '700',
            marginBottom: '8px',
            lineHeight: '1.4'
        };

        const subtitleStyle = {
            color: '#adb5bd',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            marginBottom: '12px'
        };

        const globalButtonContainerStyle = {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '12px',
            justifyContent: 'center',
            marginTop: '16px'
        };

        const globalButtons = message.globalButtons?.map((button: IButton) => {
            return this.getButton(button);
        });

        const lists = message.elements?.map((element) => {
            const elementButtons = element.buttons.map((button: IButton) => {
                return this.getButton(button);
            });

            return (
                <div
                    style={cardStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                    }}
                >
                    {element.image_url && (
                        <img src={element.image_url} style={imageStyle} alt={element.title} loading="lazy" />
                    )}
                    {element.title && (
                        <p style={titleStyle}>{element.title}</p>
                    )}
                    {element.subtitle && (
                        <p style={subtitleStyle}>{element.subtitle}</p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {elementButtons}
                    </div>
                </div>
            );
        });

        return (
            <div style={containerStyle}>
                <style>{`
                    /* Custom scrollbar for webkit browsers */
                    div::-webkit-scrollbar {
                        height: 8px;
                    }
                    div::-webkit-scrollbar-track {
                        background: #4b1e4e;
                        border-radius: 4px;
                    }
                    div::-webkit-scrollbar-thumb {
                        background: linear-gradient(135deg, #C270C8 0%, #B42583 100%);
                        border-radius: 4px;
                    }
                    div::-webkit-scrollbar-thumb:hover {
                        background: linear-gradient(135deg, #d080d8 0%, #c43593 100%);
                    }
                `}</style>
                <div style={scrollContainerStyle}>
                    {lists}
                </div>
                {globalButtons && globalButtons.length > 0 && (
                    <div style={globalButtonContainerStyle}>
                        {globalButtons}
                    </div>
                )}
            </div>
        );
    }

    performAction(button: IButton) {
        botman.callAPI(button.payload, true, null, (msg: IMessage) => {
            this.props.messageHandler({
                text: msg.text,
                type: msg.type,
                actions: msg.actions,
                attachment: msg.attachment,
                additionalParameters: msg.additionalParameters,
                from: 'chatbot'
            });
        }, () => { });
    }
}
