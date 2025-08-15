// src/components/MyLitElement.js

import * as React from 'react';
import { createComponent } from '@lit/react';

// 导入你的 Lit 组件的类，而不是它的注册文件
import {  Button , walletAdapter} from '@wgb5445/aptos-wallet-connect-kit';

export const WalletConnectButton = createComponent({
  // 在 React 中的组件名
  tagName: 'wallet-connect-button',
  // React 库
  elementClass: Button.WalletConnectButton,
  react: React,
    // 传递给 LitElement 的属性
  
});