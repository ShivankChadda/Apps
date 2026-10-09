'use strict';
/*
 * A synthetic X Article in the shape the FxTwitter API returns (see README, "Data source").
 * It is NOT a capture of a real article: it exercises every block / entity type we handle.
 */
const text = (s, extra) => Object.assign({ key: Math.random().toString(36).slice(2, 7), data: {}, entityRanges: [], inlineStyleRanges: [], text: s, type: 'unstyled' }, extra || {});
const at = (s, sub) => ({ offset: s.indexOf(sub), length: sub.length });

const p2 = 'Read the original paper for the details, and the follow-up too.';
const p3 = 'Energy is $E = mc^2$, a cup of coffee costs $5 and a sandwich $10, and snake_case_names stay intact.';
const p8 = 'Tabs vs spaces: see the paper again and the follow-up.';
const trick = '#1 hashtag, 1. not a list, > not a quote, <script>alert(1)</script> & 50% * 2 = 100';

const blocks = [
  text('Why attention works', { type: 'header-two' }),
  text(p2, {
    entityRanges: [{ key: 0, ...at(p2, 'original paper') }, { key: 1, ...at(p2, 'follow-up') }],
    inlineStyleRanges: [{ style: 'Bold', ...at(p2, 'details') }, { style: 'Italic', ...at(p2, 'too') }]
  }),
  text(p3),
  text(' ', { type: 'atomic', entityRanges: [{ key: 2, offset: 0, length: 1 }] }),
  text('$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$'),
  text('Key ideas', { type: 'header-three' }),
  text('Queries and keys', { type: 'unordered-list-item' }),
  text('Scaled by \\(\\sqrt{d_k}\\)', { type: 'unordered-list-item', depth: 1 }),
  text('Values', { type: 'unordered-list-item' }),
  text('First', { type: 'ordered-list-item' }),
  text('Second', { type: 'ordered-list-item' }),
  text('Second-a', { type: 'ordered-list-item', depth: 1 }),
  text('Third', { type: 'ordered-list-item' }),
  text('Simplicity is prerequisite for reliability.', { type: 'blockquote' }),
  text('def attention(q, k, v):', { type: 'code-block' }),
  text('    w = softmax(q @ k.T / sqrt(d))  # $not math$', { type: 'code-block' }),
  text('    return w @ v', { type: 'code-block' }),
  text(' ', { type: 'atomic', entityRanges: [{ key: 3, offset: 0, length: 1 }] }),
  text(' ', { type: 'atomic', entityRanges: [{ key: 4, offset: 0, length: 1 }] }),
  text(' ', { type: 'atomic', entityRanges: [{ key: 5, offset: 0, length: 1 }] }),
  text(' ', { type: 'atomic', entityRanges: [{ key: 6, offset: 0, length: 1 }] }),
  text(' ', { type: 'atomic', entityRanges: [{ key: 7, offset: 0, length: 1 }] }),
  text(p8, { entityRanges: [{ key: 0, ...at(p8, 'the paper') }, { key: 1, ...at(p8, 'follow-up') }] }),
  text(''),
  text(trick),
  text('Café naïve — “quotes” … done ✓', { inlineStyleRanges: [{ style: 'Strikethrough', offset: 0, length: 4 }] })
];

const entityMap = [
  { key: '0', value: { type: 'LINK', mutability: 'Mutable', data: { url: 'https://arxiv.org/abs/1706.03762' } } },
  { key: '1', value: { type: 'LINK', mutability: 'Mutable', data: { url: 'https://example.org/follow-up?a=1&b=(2)' } } },
  { key: '2', value: { type: 'MEDIA', mutability: 'Immutable', data: { entityKey: '2', mediaItems: [{ localMediaId: '1', mediaCategory: 'DraftTweetImage', mediaId: '1001' }] } } },
  { key: '3', value: { type: 'TWEET', mutability: 'Immutable', data: { tweetId: '555' } } },
  { key: '4', value: { type: 'LATEX', mutability: 'Immutable', data: { text: 'a^2 + b^2 = c^2' } } },
  { key: '5', value: { type: 'MARKDOWN', mutability: 'Mutable', data: { entityKey: '5', markdown: '| Model | Score |\n|---|---|\n| A | 0.91 |\n| B | 0.87 |' } } },
  { key: '6', value: { type: 'DIVIDER', mutability: 'Immutable', data: {} } },
  { key: '7', value: { type: 'MEDIA', mutability: 'Immutable', data: { entityKey: '7', mediaItems: [{ localMediaId: '2', mediaCategory: 'DraftTweetGif', mediaId: '1002' }] } } }
];

const img = (id, url) => ({ id, media_key: '3_' + id, media_id: id, media_info: { __typename: 'ApiImage', original_img_url: url, original_img_width: 800, original_img_height: 600, color_info: { palette: [] } } });

const tweet = {
  url: 'https://x.com/ada/status/999',
  id: '999',
  created_at: 'Wed Oct 08 14:03:11 +0000 2026',
  author: { name: 'Ada Lovelace', screen_name: 'ada' },
  article: {
    id: '1', created_at: '2026-10-08T14:03:11.000Z', title: 'Attention & “Equations”: a 100% [test]',
    preview_text: 'A short tour of attention with math, code and pictures.',
    cover_media: img('900', 'https://pbs.twimg.com/media/cover.jpg'),
    content: { blocks, entityMap },
    media_entities: [
      img('1001', 'https://pbs.twimg.com/media/photo.png'),
      { id: '1002', media_key: '16_1002', media_id: '1002', media_info: { __typename: 'ApiGif', type: 'animated_gif', id: '1002', id_str: '1002', ext_alt_text: null, media_url_https: 'https://pbs.twimg.com/tweet_video_thumb/anim.gif', video_info: { variants: [{ bitrate: 0, content_type: 'video/mp4', url: 'https://video.twimg.com/tweet_video/anim.mp4' }] } } }
    ]
  }
};

const quoted = {
  '555': { url: 'https://x.com/alan/status/555', id: '555', created_at: 'Tue Oct 07 09:00:00 +0000 2026', author: { name: 'Alan Turing', screen_name: 'alan' }, text: 'Can machines think?\n\nI propose to consider that question.' }
};

module.exports = { tweet, quoted };
