import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { AiOutlineCalendar , AiOutlineUser , AiOutlineClockCircle } from "react-icons/ai";
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}:PostProps) {
  const router = useRouter()

  const totalWords = post.data.content.reduce((total, iten) => {
    console.log(iten.heading)
    if(iten.heading){
      total += iten.heading.split(' ').length; 
    }
    const words = iten.body.map(iten => {
      return iten.text.split(' ').length;
    }) 

    words.map(word => total += word)
    return total;
  }, 0)

  const readTime = Math.ceil( totalWords / 200)


  if(router.isFallback){
    return <h1>Carregando...</h1>
  }

  const formatDate = format(
    new Date(post.first_publication_date),
    "dd MMM yyyy",
    {
      locale: ptBR
    }         
  )

  return (
    <div className={styles.container}>
      <img src={post.data.banner.url} alt="banner" />
      <main className={styles.post}>
        <h1>
          {post.data.title}
        </h1>
        <div>
          <h3>
            <AiOutlineCalendar className={styles.icon}/>
            {formatDate}
          </h3>
          <h3>
            <AiOutlineUser className={styles.icon}/>
            {post.data.author}
          </h3>
          <h3>
            <AiOutlineClockCircle className={styles.icon}/>
            {`${readTime} min`}
          </h3>
        </div>

        {post.data.content.map(content => {
          return (
            <article key={content.heading}>
              <h2>{content.heading}</h2>
              <div className={styles.body} dangerouslySetInnerHTML={{__html: RichText.asHtml(content.body)}}></div>
            </article>
          )
        })}

      </main> 
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);


  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return{
    paths, 
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({params}) => {
  const { slug } = params;
  
  const prismic = getPrismicClient(); 

  const postResponse =await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: postResponse.uid,
    first_publication_date: postResponse.first_publication_date,
    data: {
      title: postResponse.data.title,      
      subtitle: postResponse.data.subtitle,              
      banner: {
        url: postResponse.data.banner.url,
      },
      author: postResponse.data.author,
      content: postResponse.data.content.map(content => {
        return{
          heading: content.heading,
          body: [...content.body]
        }
      })
    }
  } 

  return{
    props:{post},
    revalidate: 60 * 60, //60 minutes
  }
};
