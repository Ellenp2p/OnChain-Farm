import { useSettingsStore } from '@/stores/settingsStore';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function Settings() {
	const { rpcUrl, apiKey, setRpcUrl, setApiKey } = useSettingsStore();
	const [tmpRpc, setTmpRpc] = useState(rpcUrl);
	const [tmpKey, setTmpKey] = useState(apiKey);

	useEffect(() => { setTmpRpc(rpcUrl); }, [rpcUrl]);
	useEffect(() => { setTmpKey(apiKey); }, [apiKey]);

	const onSave = () => {
		setRpcUrl(tmpRpc.trim());
		setApiKey(tmpKey.trim());
		alert('设置已保存');
	};

	return (
		<div className="layout">
			<div className="topbar">
				<strong>设置</strong>
				<div style={{ marginLeft: 'auto' }}>
					<Link className="btn" to="/">返回</Link>
				</div>
			</div>
			<div className="panel panel-xl">
				<h3 className="title-xl">链接入</h3>
				<div className="form-grid">
					<label>
						<div className="label-muted">RPC URL</div>
						<input className="input input-lg" placeholder="https://fullnode.mainnet.aptoslabs.com/v1" value={tmpRpc} onChange={e => setTmpRpc(e.target.value)} />
					</label>
					<label>
						<div className="label-muted">API Key（可选）</div>
						<input className="input input-lg" placeholder="例如：你的服务商 API Key" value={tmpKey} onChange={e => setTmpKey(e.target.value)} />
					</label>
					<div style={{ display: 'flex', gap: 12 }}>
						<button className="btn btn-lg primary" onClick={onSave}>保存</button>
						<Link className="btn btn-lg" to="/">取消</Link>
					</div>
				</div>
			</div>
		</div>
	);
}


