import { Component } from 'preact';
import type { IConfiguration, IMessage } from '../typings';
import MessageHolder from "./message-holder";
import { useEffect, useState } from 'preact/hooks';
import { botman } from './botman';

const toString = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) return val.map(toString).join('');
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

export default class MessageArea extends Component<IMessageAreaProps, any> {

	render(props: IMessageAreaProps, { }) {
		const styleChat = props.conf.wrapperHeight ? 'height:' + (props.conf.wrapperHeight - 90) + 'px;' : '';

		const [loading, setLoading] = useState(false);

		useEffect(() => {
			const unsubscribe = botman.subscribeLoadingChange(setLoading);
			return unsubscribe;
		}, []);

		let calculatedTimeout = 0;
		// @ts-ignore
		return (
			<ol class="chat">
				{
					props.messages.map((message) => {
						const safeMessage = {
							...message,
							type: typeof message.type === 'string' ? message.type : 'text',
							text: toString(message.text),
							from: typeof message.from === 'string' ? message.from : 'unknown',
						};
						const listElement = <MessageHolder
							message={safeMessage}
							calculatedTimeout={calculatedTimeout}
							messageHandler={props.messageHandler}
							conf={props.conf}
						/>;

						calculatedTimeout += (message.timeout || 0) * 1000;

						return listElement;
					})
				}
				{
					props.conf.useLoader && loading && (<li class="clearfix">
						<div className="loading-dots">
							<span className="dot"></span>
							<span className="dot"></span>
							<span className="dot"></span>
						</div>
					</li>)
				}

			</ol>
		);
	}

}

interface IMessageAreaProps {
	conf: IConfiguration,
	messages: IMessage[],
	messageHandler: Function,
};
