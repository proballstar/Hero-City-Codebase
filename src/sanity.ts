import SanityClient from '@sanity/client'
import SanityInfo from '../moralis.server.json'

export default SanityClient({
    projectId: SanityInfo.PROJECT_ID,
    dataset: "production",
    useCdn: true,
    token: SanityInfo.SANITY_TOKEN
})