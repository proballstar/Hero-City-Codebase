import { NextApiRequest, NextApiResponse } from 'next'
import client from '../../src/sanity'

interface Data {
    posts: any
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    try {
        let posts = await client.fetch(
            `*[_type== "posts"] {
                _id,
                name,
                poster,
                content,
                owner,
                hero_wallet
            }`
        )
        console.log(posts)
        res.status(200).json({
            posts
        })
    } catch (e) {
        res.status(500).json({
            posts: e
        })
    }
}