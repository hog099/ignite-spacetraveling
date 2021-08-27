import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { IoCalendarClearOutline, IoPersonOutline, IoTimeOutline } from 'react-icons/io5';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  slug: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  title: string;
  subtitle: string;
  author: string;
  banner: {
    url: string;
  };
  content: {
    heading: string;
    body: {
      text: string;
    }[];
  }[];
}

interface PostProps {
  post: Post;
}


export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }


  const [time, setTime] = React.useState('');

  React.useEffect(() => {
    const result = post.content.reduce((acc, content) => {
      const textBody = RichText.asText(content.body);
      const split = textBody.split(' ');
      const numberWords = split.length;
  
      const result = Math.ceil(numberWords / 200);
      return acc + result;
    }, 0);
    
    setTime(`${result} min`);   

  }, []);


  return (
    <>
      <Head>Post | Space Traveling</Head>
      <div className={styles.containerbanner}>
        <img src={post.banner.url} alt="image-banner" />
      </div>
      <main className={styles.container}>
        <section className={styles.content}>

          <h2>{post.title}</h2>
          <div className={styles.info}>
            <span>
              <IoCalendarClearOutline />
              <p>{post.last_publication_date}</p>
            </span>
            <span>
              <IoPersonOutline />
              <p>{post.author}</p>
            </span>
            <span>
              <IoTimeOutline />
              <p>{time}</p>
            </span>
          </div>

          <div className={styles.sectionbody}>

          {post.content.map(item => (
            <section  className={styles.sectionbodycontent} key={item.heading}>
              <h2>{RichText.asText(item.heading)}</h2>
              <article
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(item.body),
                }}
                />
            </section>
          ))}
          </div>


        </section>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    slug: response.uid,
    first_publication_date: new Date(response.first_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    last_publication_date: new Date(response.last_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    title: RichText.asText(response.data.title),
    subtitle: RichText.asHtml(response.data.subtitle),
    author: RichText.asText(response.data.author),
    banner: response.data.banner,
    content: response.data.content,
  };


  return {
    props: {
      post
    }
  }

}
