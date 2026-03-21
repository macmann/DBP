export type PageEditorFormModel = {
  details: {
    title: string;
    slug: string;
  };
  prompt: string;
  widgetEmbedHtml: string;
  referenceLinks: string[];
};
