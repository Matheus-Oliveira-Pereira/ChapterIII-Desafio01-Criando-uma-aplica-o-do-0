import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { AiOutlineCalendar , AiOutlineUser } from "react-icons/ai";
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}



export default function Home({ postsPagination }: HomeProps) {
  const formattedPost = postsPagination.results.map(post => {

    return {
      ...post,
      data: {
        ...post.data,
      },
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState<string>(postsPagination?.next_page)

  const handleNextPage = async () => {
    if(nextPage === null) return;

    try{
      const newPostsPagination = await fetch(`${nextPage}`).then(res => res.json())
      console.log(newPostsPagination)
      setNextPage(newPostsPagination.next_page)

      const newsPosts = newPostsPagination.results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            "dd MMM yyyy",
            {
              locale: ptBR
            }         
          ),
          data:{
            title: post.data.title,          
            subtitle: post.data.subtitle,          
            author: post.data.author,          
          }
        }
      })

      setPosts( oldState => [...posts, ...newsPosts ] );
    }catch(e){

    }

  }


  return (
    <div className={styles.container}>
        { posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
                <a key={post.uid} className={styles.posts}>
                    
                    <h1>
                      {post.data.title}
                    </h1>
                    <h2>
                        {post.data.subtitle}
                    </h2>
                    <div>
                      <h3>
                        <AiOutlineCalendar className={styles.icon}/>
                        {post.first_publication_date}
                      </h3>
                      <h3>
                        <AiOutlineUser className={styles.icon}/>
                        {post.data.author}
                      </h3>
                    </div>                      
                </a>
            </Link>              
        ))}
        { nextPage !== null 
          ?  <button type='button' onClick={handleNextPage}>
              Carregar mais posts
            </button>
          : null
        }
        
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 3,
    }
  );

  

  const posts = postsResponse.results.map(post => {
    return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data:{
          title: post.data.title,          
          subtitle: post.data.subtitle,          
          author: post.data.author,          
        }
    }
  })  

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts, 
  }

  return {
    props: {
      postsPagination, 
    },
    revalidate: 60 * 60, //60 minutes
  }
};
