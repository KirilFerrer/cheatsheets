// One catalogue supplies the homepage, topic dialogs and Custom index.
hexo.extend.helper.register('study_catalogue', function () {
  const posts = this.site.posts.toArray().filter((post) => post.layout === 'learning');
  const find = (slug, label) => {
    const post = posts.find((item) => item.slug === slug);
    return post ? { post, label, path: post.path } : null;
  };
  const groups = [
    {
      id: 'docker',
      title: 'Docker',
      category: 'Toolkit',
      icon: 'docker',
      items: [
        ['docker', 'Base'],
        ['docker-dockerfile', 'Dockerfile'],
        ['docker-compose', 'Docker Compose']
      ]
    },
    {
      id: 'django',
      title: 'Django',
      category: 'Python',
      icon: 'django',
      items: [['django', 'Base']]
    },
    {
      id: 'redis',
      title: 'Redis',
      category: 'Database',
      icon: 'redis',
      items: [['redis', 'Base']]
    },
    {
      id: 'llm',
      title: 'LLM Engineering',
      category: 'AI',
      icon: 'ai',
      items: [
        ['llm-week-1', 'Week 1'],
        ['llm-week-2', 'Week 2'],
        ['llm-week-3', 'Week 3']
      ]
    }
  ].map((group) => ({
    ...group,
    items: group.items.map(([slug, label]) => find(slug, label)).filter(Boolean)
  }));
  const custom = posts
    .filter((post) => post.categories.toArray().some((category) => category.name === 'Custom'))
    .sort((a, b) => (a.menu_title || a.title).localeCompare(b.menu_title || b.title, 'es'))
    .map((post) => ({ post, label: post.menu_title || post.title, path: post.path }));
  return [
    ...groups.filter((group) => group.items.length),
    { id: 'custom', title: 'Custom', category: 'Custom', items: custom }
  ];
});
