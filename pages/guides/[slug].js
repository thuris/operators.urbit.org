import { useRouter } from "next/router";
import { getPostBySlug, getAllPosts } from "../../lib/lib";
import Head from "next/head";
import Link from "next/link";
import Meta from "../../components/Meta";
import ErrorPage from "../404";
import Container from "../../components/Container";
import Markdown from "../../components/Markdown";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SingleColumn from "../../components/SingleColumn";
import Section from "../../components/Section";
import { TableOfContents } from "../../components/TableOfContents";
import { decode } from "html-entities";
import { useEffect, useState } from "react";

export default function Post({ post, markdown }) {
  const router = useRouter();
  if (!router.isFallback && !post?.slug) {
    return <ErrorPage />;
  }

  if (post?.tabbed) {
    return <TabbedLayout post={post} markdown={markdown} />;
  }
  return (
    <Container>
      <Head>
        <title>{post.title} • Updates • operators.urbit.org</title>
        {Meta(post)}
      </Head>
      <SingleColumn>
        <Header />
        <Section short>
          <h1>{post.title}</h1>
          <h3 className="measure mt-6">{post.description}</h3>
        </Section>
        <Section>
          <div className="block lg:flex">
            <article
              className={"markdown pr-0 lg:pr-16 max-w-prose"}
              dangerouslySetInnerHTML={{ __html: decode(markdown) }}
            ></article>
            <TableOfContents />
          </div>
        </Section>
        <Footer />
      </SingleColumn>
    </Container>
  );
}

const TabbedLayout = ({ post, markdown }) => {
  const [list, setList] = useState([]);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (router.isReady) {
      const sections = Array.from(document.querySelectorAll("article div"));
      setList([
        ...list,
        ...sections
          .filter((e) => e.title)
          .map((e) => ({ title: e.title, id: e.id })),
      ]);
    }
  }, [router.isReady]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("article div"));
    sections.forEach((section) => {
      if (section.title && id !== section.id) {
        section.classList.add("hidden");
      } else {
        section.classList.remove("hidden");
      }
    });
    if (!id) {
      sections[0].classList.remove("hidden");
    }
    setTimeout(() => setReady(true), 150);
  }, [id]);

  return (
    <Container>
      <Head>
        <title>{post.title} • Updates • operators.urbit.org</title>
        {Meta(post)}
      </Head>
      <SingleColumn>
        <Header />
        <Section short>
          <h1 className="mb-4">{post.title}</h1>
          {list.map((item) => (
            <Link href={{ query: { slug: post.slug, id: item.id } }} passHref>
              <a
                className={
                  "type-ui mr-4 " +
                  (id === item.id || (item.id === "overview" && !id)
                    ? "pb-1 border-b-4"
                    : "text-wall-400")
                }
              >
                {item.title}
              </a>
            </Link>
          ))}
        </Section>
        <Section>
          <div className="block max-w-prose lg:flex">
            <article
              className={"markdown pr-0 lg:pr-16 " + (ready ? "" : "hidden")}
              dangerouslySetInnerHTML={{ __html: decode(markdown) }}
            ></article>
          </div>
        </Section>
        <Footer />
      </SingleColumn>
    </Container>
  );
};

//
export async function getStaticProps({ params }) {
  const post = getPostBySlug(
    params.slug,
    ["title", "slug", "description", "tabbed", "content"],
    "guides"
  );

  const markdown = await Markdown({ post });

  return {
    props: { post, markdown },
  };
}

export async function getStaticPaths() {
  const posts = getAllPosts(["slug"], "guides");

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: false,
  };
}
