// @vitest-environment node
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('creates and fetches blogs with slug auto-generation', async () => {
    // 1. Create a user to act as the author
    const email = `test-author-${Date.now()}@example.com`
    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password: 'password123',
      },
    })

    // Create a category
    const category = await payload.create({
      collection: 'blog-categories',
      data: {
        name: 'Tech',
        slug: 'tech',
      },
      draft: true,
    })

    // 2. Create a blog post
    const blog = await payload.create({
      collection: 'blog',
      data: {
        title: 'My First Blog Post',
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'This is the body of the blog post.',
                  },
                ],
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        authors: [user.id],
        categories: [category.id],
      },
      draft: true,
    })

    expect(blog).toBeDefined()
    expect(blog.title).toBe('My First Blog Post')
    expect(blog.slug).toBe('my-first-blog-post') // Verify slug auto-generation works
    expect(blog._status).toBe('draft') // Default status is draft

    // 3. Find the created blog post
    const found = await payload.find({
      collection: 'blog',
      where: {
        slug: {
          equals: 'my-first-blog-post',
        },
      },
    })

    expect(found.docs.length).toBe(1)
    expect(found.docs[0].title).toBe('My First Blog Post')

    // Clean up
    await payload.delete({
      collection: 'blog',
      id: blog.id,
    })
    await payload.delete({
      collection: 'blog-categories',
      id: category.id,
    })
    await payload.delete({
      collection: 'users',
      id: user.id,
    })
  })
})

