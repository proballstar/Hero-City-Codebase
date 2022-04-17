import type { NextApiRequest, NextApiResponse } from 'next'
import client from '../../src/sanity'

type Data = {
  msg: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method == 'POST') {
    let postData = await JSON.parse(req.body)

    try {
      await client.
        create({
          _type: 'post',
          name: postData.name,
          poster: postData.poster,
          content: postData.content,
          owner: postData.owner,
          hero_wallet: postData.wallet
        })
        .then(res => console.table(res))
      res.status(200)
        .json({
          msg: 'Successful'
        })
    } catch (err) {
      console.error(err)
      res.status(500)
        .json({
          msg: 'Error in console'
        })
    }
  } else {
    res.status(404)
      .json({
        msg: `
          Wrong URL, current method ${req.method} at Create Post Method
        `
      })
  }
}

