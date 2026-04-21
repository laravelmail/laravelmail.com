import { Component } from 'preact';
import type { IMessage, IMessageHolderProps, IMessageTypeState } from '../typings';
import TextType from "./messages/text";
import ActionType from "./messages/action";
import TypingIndicator from "./messages/typing-indicator";
import ListType from "./messages/list";
import ButtonsType from "./messages/buttons";

const dayInMillis = 60 * 60 * 24 * 1000;

const messageTypes = {
    actions: ActionType,
    buttons: ButtonsType,
    list: ListType,
    text: TextType,
    typing_indicator: TypingIndicator
};

export default class MessageHolder extends Component<IMessageHolderProps, any> {

    scrollToBottom = () => {
        const hostElement = document.querySelector('botman-widget');
        if (hostElement && hostElement.shadowRoot) {
            const messageArea = hostElement.shadowRoot.getElementById('messageArea');
            if (messageArea !== null) {
                messageArea.scrollTop = messageArea.scrollHeight;
            }
            return
        }

        const messageArea = document.getElementById('messageArea');
        if (messageArea !== null) {
            messageArea.scrollTop = messageArea.scrollHeight;
        }
    };

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }

    messageVisibilityChange = (message: IMessage, messageState: IMessageTypeState) => {
        const msg = this.props.message;
        if (msg.id === message.id && msg.visible !== messageState.visible) {
            msg.visible = messageState.visible;
            // Reset the timeout
            msg.timeout = 0;
            this.forceUpdate();
        }
    };
    render(props: IMessageHolderProps) {
        const message = props.message || { type: 'text', from: 'unknown', text: '' };
        const messageType = typeof message.type === 'string' ? message.type : 'text';
        const MessageComponent = messageTypes[messageType] || TextType;
        const { messageHandler, conf } = this.props;

        let styles = '';
        if (message.visible === false || message.visibilityChanged === false) {
            styles += 'display:none';
        }

        return (
            <li data-message-id={message.id} className={message.from} style={styles}>
                {messageType === 'typing_indicator'
                    ? (<MessageComponent onVisibilityChange={this.messageVisibilityChange}
                        message={message}
                        timeout={props.calculatedTimeout}
                        messageHandler={messageHandler}
                        conf={conf}
                    />)
                    : (<div className="msg">
                        <MessageComponent onVisibilityChange={this.messageVisibilityChange}
                            message={message}
                            timeout={props.calculatedTimeout}
                            messageHandler={messageHandler}
                            conf={conf}
                        />
                    </div>)
                }
            </li>
        );

    }

}
