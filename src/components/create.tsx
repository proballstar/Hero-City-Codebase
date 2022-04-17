import client from '../sanity'
import styles from './create.module.scss'
import { useFormik } from 'formik'
import { ChangeEvent } from 'react';
import { useMoralis } from 'react-moralis';
import { useState } from 'react'
import e from 'express';

export default function CreatePost() {

    let { Moralis, user } = useMoralis()
    
    let [cover, setCover] = useState<File>()

    let { setFieldValue, handleChange, values, isSubmitting } = useFormik<{
        name: string;
        hero_wallet: string;
        content: string;
    }>({
        initialValues: {
            name: '',
            hero_wallet: '',
            content: ''
        },
        onSubmit: async ({ content, hero_wallet, name }, h) => {
            console.log(cover)
            let moralisFile = new Moralis.File(cover!.name, cover!)
            alert()
            console.log(moralisFile)
            await moralisFile.saveIPFS()
            console.table({
                url: moralisFile.getData(),
                hash: moralisFile.url()
            })
        }
    }) 
    
    function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
        let files = e.currentTarget.files;
        setCover(files![0])
    }

    async function handleSubmit(e: any) {
        e.preventDefault()
        console.log(cover)
        let moralisFile = new Moralis.File(cover!.name, cover!)
        await moralisFile.saveIPFS()
        console.log(moralisFile._url)
        await client
                .create({
                    _type: 'post',
                    name: values.name,
                    poster: moralisFile._url,
                    content: values.content,
                    owner: user?.getUsername(),
                    hero_wallet: values.hero_wallet
                })
        alert()
    }

    return (
        <div style={{ width: '100vh' }}>
            <form>
                <div>
                    <label className={styles.label}>
                        Name:
                    </label>
                    <input name='name' className={styles.input} onChange={handleChange} value={values.name} />
                </div>
                <div>
                    <label className={styles.label}>
                        Cover:
                    </label>
                    <input name='file' className={styles.file} type={'file'} onChange={e => handleFileUpload(e)} />
                </div>
                <div>
                    <label className={styles.label}>
                        Hero's Wallet Address:
                    </label>
                    <input name='hero_wallet' className={styles.input} onChange={handleChange} value={values.hero_wallet}  />
                </div>
                <div>
                    <label className={styles.label}>
                        Post Content:
                    </label>
                    <textarea name='content' className={styles.input} onChange={handleChange} value={values.content} />
                </div>
                <button onClick={(e) => handleSubmit(e)} disabled={isSubmitting}>
                    Submit
                </button>
            </form>
        </div>
    )
}