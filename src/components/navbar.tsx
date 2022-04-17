import React from 'react'
import { ConnectButton, Avatar, Badge} from 'web3uikit'
import Image from 'next/image'
import styles from './navbar.module.scss'

export default function Navbar({children}: {children: React.ReactNode}) {
    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                textAlign: 'center'
            }}
        >
            <div className={styles.section}>
                <div className={styles.logo} >
                    <Image src={require("../../images.jpg")} className={styles.image} />
                </div>
                <div className={styles.comp} >
                    Hero City
                </div>
            </div>
            <div className={styles.tabs}>
                {children}
            </div>
            <div className={styles.section}>
                <div className={styles.comp} >
                    <ConnectButton />
                </div>
            </div>
        </div>
    )
}