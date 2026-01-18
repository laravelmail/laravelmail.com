import {botman} from './../botman';
import MessageType from "./messagetype";
import { IMessageTypeProps, IAction, IMessage } from '../../typings';

export default class Action extends MessageType {

    render(props: IMessageTypeProps) {
        const { message } = props;

        const containerStyle = {
            width: '100%',
            maxWidth: '75%',
            margin: '0 auto',
            padding: '16px',
            background: 'linear-gradient(135deg, #59079E 0%, #4b1e4e 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(194, 112, 200, 0.2)'
        };

        const textStyle = {
            color: '#eaeaea',
            fontSize: '1rem',
            lineHeight: '1.6',
            marginBottom: '16px',
            padding: '0 8px'
        };

        const buttonContainerStyle = {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '12px',
            justifyContent: 'center'
        };

        const buttonStyle = {
            background: 'linear-gradient(135deg, #C270C8 0%, #B42583 100%)',
            color: '#eaeaea',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(194, 112, 200, 0.3)',
            minWidth: '120px',
            textAlign: 'center' as const
        };

        const buttons = message.actions?.map((action: IAction) => {
            return (
                <div
                    class="btn action-btn"
                    style={buttonStyle}
                    onClick={() => this.performAction(action)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(194, 112, 200, 0.5)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #d080d8 0%, #c43593 100%)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(194, 112, 200, 0.3)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #C270C8 0%, #B42583 100%)';
                    }}
                >
                    {action.text}
                </div>
            );
        });

        return (
            <div style={containerStyle}>
                {message.text && <div style={textStyle}>{message.text}</div>}
                {this.state.attachmentsVisible && buttons && buttons.length > 0 && (
                    <div style={buttonContainerStyle}>{buttons}</div>
                )}
            </div>
        );
    }

    performAction(action: IAction) {
        const isActionRespondVisible = action?.additional?.isActionRespondVisible;
        if (isActionRespondVisible) {
            this.props.messageHandler({
                text: action.text,
                type: 'text',
                from: 'visitor'
            });
        }
        botman.callAPI(action.value, true, null, (msg: IMessage) => {
            this.setState({ attachmentsVisible : false});
            this.props.messageHandler({
                text: msg.text,
                type: msg.type,
                timeout: msg.timeout,
                actions: msg.actions,
                attachment: msg.attachment,
                additionalParameters: msg.additionalParameters,
                from: 'chatbot'
            });
        }, () => {});
    }
}
