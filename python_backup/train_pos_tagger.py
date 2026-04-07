import nltk
from nltk.corpus import treebank
from nltk.tag import UnigramTagger, BigramTagger, TrigramTagger
from tag_util import WordNetTagger, backoff_tagger
import pickle

# Download required NLTK data
nltk.download('treebank')
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')

# Load Treebank data
treebank_data = treebank.tagged_sents()

# Split into train and test
train_data = treebank_data[:100]  # Smaller for testing
test_data = treebank_data[3000:3100]  # Smaller test set

print(f"Training data size: {len(train_data)}")
print(f"Test data size: {len(test_data)}")

# Create WordNet tagger as backoff
default_tag = 'NN'
wn_tagger = WordNetTagger(default_tag)

# Create backoff tagger chain
tagger = backoff_tagger(train_data, [UnigramTagger, BigramTagger, TrigramTagger], backoff=wn_tagger)

# Evaluate the tagger
accuracy = tagger.evaluate(test_data)
print(f"Tagger accuracy: {accuracy:.4f}")

# Save the trained tagger
with open('pos_tagger.pkl', 'wb') as f:
    pickle.dump(tagger, f)

print("Trained POS tagger saved to pos_tagger.pkl")

# Test the tagger on a sample sentence
test_sentence = "The quick brown fox jumps over the lazy dog".split()
tagged = tagger.tag(test_sentence)
print(f"Sample tagging: {tagged}")
