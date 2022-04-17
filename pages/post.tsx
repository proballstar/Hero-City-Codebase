import { useRouter } from "next/router";
import { useEffect, useState } from 'react'
import client from '../src/sanity'
import ReactMarkdown from 'react-markdown'
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import styles from '../styles/post.module.css'
import { useMoralis } from "react-moralis";

export default function Post() {
    let router = useRouter()
    let [post, setPost] = useState({
        name: '',
        poster: '',
        owner: '',
        hero_wallet: '',
        _id: '',
        content: ''
    })
    let { Moralis } = useMoralis()
    let [loading, setLoading] = useState<boolean>(true)

    async function getPost() {
        setLoading(true)
        let _posts = await client.fetch(
            `*[_type== "post" && _id==$postId] {
                name,
                poster,
                owner,
                hero_wallet,
                content
            }`,   
            {
               postId: router.query.id 
            }
        )
        setPost(_posts[0])
        setLoading(false)
    }

    async function donateToHero() {
        const opts = {
            type: 'native',
            amount: Moralis.Units.ETH(0.001),
            receiver: post.hero_wallet
        }

        let result = await Moralis.transfer(opts as any)
    }

    useEffect(() => {
        getPost()
    }, [router.query.id])

    if (loading) return <div>{router.query.id} Loading...</div>
    else {
        return (
            <div>
                <div style={{ backgroundImage: `url(${post.poster})`, paddingTop: '300px', color: 'white'}}>
                    <div style={{
                        fontSize: '40px',
                        fontWeight: 'bolder'
                    }}>
                        {post.name} {" "}
                        by {post.owner}
                    </div>
                </div>
                <ReactMarkdown className={styles.mkdown} remarkPlugins={[remarkGfm, remarkDirective]}>
                    {post.content}
                </ReactMarkdown>
                <div className={styles.footer}>
                    Donate to this Hero at <button onClick={() => donateToHero()} style={{ backgroundColor: 'blue', padding: '8px 12px 8px 12px', fontWeight: 'bold', borderRadius: '20px', color: 'white'}}>Donate</button>
                    
                </div>
            </div>
        )
    }
}