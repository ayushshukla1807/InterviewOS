from nltk.tag import SequentialBackoffTagger
from nltk.corpus import wordnet
from nltk import pos_tag
import nltk

class WordNetTagger(SequentialBackoffTagger):
    def __init__(self, default_tag='NN'):
        super().__init__()
        self.default_tag = default_tag

    def choose_tag(self, tokens, index, history):
        """Choose tag for the token at the given index"""
        word = tokens[index]
        wn_pos = self.get_wordnet_pos(word)
        return self.map_to_penn(wn_pos)

    def get_wordnet_pos(self, word):
        """Map POS tag to first character lemmatize() accepts"""
        tag = pos_tag([word])[0][1]
        tag_dict = {"J": wordnet.ADJ,
                    "N": wordnet.NOUN,
                    "V": wordnet.VERB,
                    "R": wordnet.ADV}
        return tag_dict.get(tag[0].upper(), wordnet.NOUN)

    def map_to_penn(self, wn_tag):
        """Map WordNet tag to Penn Treebank tag"""
        tag_dict = {wordnet.NOUN: 'NN',
                    wordnet.VERB: 'VB',
                    wordnet.ADJ: 'JJ',
                    wordnet.ADV: 'RB'}
        return tag_dict.get(wn_tag, self.default_tag)

def backoff_tagger(train_data, tagger_classes, backoff=None):
    """
    Create a backoff tagger chain.

    Args:
        train_data: Tagged sentences for training
        tagger_classes: List of tagger classes to use in order
        backoff: The backoff tagger to start with

    Returns:
        The top-level tagger in the chain
    """
    current_backoff = backoff

    for tagger_class in tagger_classes:
        current_backoff = tagger_class(train_data, backoff=current_backoff)

    return current_backoff
