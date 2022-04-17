import type { NextPage } from 'next'
import { Tab, TabList } from 'web3uikit'
import Navbar from '../src/components/navbar'
import ViewPosts from '../src/components/view'
import CreatePost from '../src/components/create'
import NFTsMinter from '../src/components/nfts'

const Home: NextPage = () => {

  return (
    <div>
      <Navbar>
        <TabList defaultActiveKey={1}>
          <Tab tabKey={1} tabName='View Posts'>
            <ViewPosts />
          </Tab>
          <Tab tabKey={2} tabName='Create a Post'>
            <CreatePost />
          </Tab>
          <Tab tabKey={3} tabName='NFTs'>
            <NFTsMinter />
          </Tab>
        </TabList>
      </Navbar>
    </div>
  )
}

export default Home
