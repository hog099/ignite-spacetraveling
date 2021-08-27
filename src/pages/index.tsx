import React from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { IoCalendarClearOutline, IoPersonOutline } from 'react-icons/io5';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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

function FormatPosts(data: PostPagination): Post[] {
  const postsFormatted = data.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        "dd MMM' 'yyyy",
        {
          locale: ptBR,
        }
      ),
      // 27 mar 2021
      data: {
        title: RichText.asText(post.data.title),
        subtitle: RichText.asText(post.data.subtitle),
        author: RichText.asText(post.data.author),
      },
    };
  });

  return postsFormatted;
}

export default function Home({ postsPagination }: HomeProps) {

  const { results, next_page } = postsPagination;

  const [nextPage, setNextPage] = React.useState(next_page);
  const [posts, setPosts] = React.useState<Post[]>([]);

  React.useEffect(() => {
    setPosts(results);
  }, []);



  async function getMorePosts() {
    if (!nextPage) return null;

    const data = await fetch(nextPage);
    const response = await data.json();
    setNextPage(response.next_page);

    const newposts = FormatPosts(response);
    // console.log("newposts", newposts);

    setPosts([...posts, ...newposts]);

  }


  return (
    <>
      <Head>Home | Space Traveling</Head>
      <main className={styles.container}>
        <section className={styles.content}>

          {posts.map(post => {
            return (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <div className={styles.post}>
                    <h2>{post.data.title}</h2>
                    <p>{post.data.title}</p>
                    <div className={styles.info}>
                      <span>
                        <IoCalendarClearOutline />
                        <p>{post.first_publication_date}</p>
                      </span>
                      <span>
                        <IoPersonOutline />
                        <p>{post.data.author}</p>
                      </span>
                    </div>
                  </div>
                </a>
              </Link>
            );
          })}

          {nextPage && (
            <div className={styles.morePosts}>
              <button type="button" onClick={getMorePosts}>
                Carregar mais posts
              </button>
            </div>
          )}

        </section>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({ preview = false, previewData }) => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: new Date(post.first_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      data: {
        title: RichText.asText(post.data.title),
        subtitle: RichText.asText(post.data.subtitle),
        author: RichText.asText(post.data.author),
      },
    };
  });


  const finalProps = {
    next_page: response.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination: finalProps,
      preview,
    },
    revalidate: 1800, // 30 minutos
  };


};
