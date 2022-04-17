import { BannerStrip } from 'web3uikit'
import { useState, useEffect } from 'react'
import { useMoralis } from 'react-moralis'
import client from '../sanity'
import { useRouter } from 'next/router'

export default function ViewPosts() {
    
    let {enableWeb3, user, isUserUpdating, isAuthenticating} = useMoralis()
    let [posts, setPosts] = useState<Array<any>>([])
    let NextRouter = useRouter()

    async function getData() {
        let _posts = await client.fetch(
            `*[_type== "post"] {
                _id,
                name,
                poster,
                owner,
                hero_wallet
            }`,
        
            {
                
            }
        )
        console.log(posts)
        setPosts(_posts)
    }

    useEffect(() => {
        getData()
    }, [user, isUserUpdating, isAuthenticating])

    return (
        <div>
            {posts.map(post => {
                return (
                    <div key={post._id} style={{ cursor: 'pointer'}} onClick={e => {
                        NextRouter.push(`
                            /post?id=${post._id}
                        `)
                    }}>
                        <div id={post._id} className='border border-slate-400' style={{borderRadius: '20px', boxShadow: '0.75px 0.75px 0.75px 0.75px'}}>
                            <div style={{ backgroundImage: `url(${post.poster})`, color: 'white', paddingTop: '150px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }} />
                            <div style={{ paddingTop: '20px', paddingBottom: '15px' }}>
                                <div>
                                    {post.name}
                                </div>
                                <div>
                                    by {String(post.owner).slice(0, 9)}
                                </div>
                            </div>
                        </div>   
                    </div>
                )
            })}
        </div>
    )
}