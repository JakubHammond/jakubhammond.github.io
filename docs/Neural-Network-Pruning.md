# Neural Network Pruning
I trained a small neural network to recognize simple 12×12 patterns like lines and squares. Using pruning, I removed unnecessary connections and neurons, keeping only what’s essential.
I believe this can make neural networks more efficient why having the same accuracy as the full neural network.

---

## Architecture
- Input 12×12 = 144 neurons
- Hidden layer: 48 neurons
- Output: 4 neurons (one per pattern)
- Connections: fully connected initially.
- Activation: ReLU
- Training method: simple gradient descent on mean squared error.

---

## Patterns
- horizontal line
- vertical line
- diagonal
- square

---

## Training and Pruning
- Training: 3,000 epochs, learning rate 0.01
- Pruning: continuously removes weights < 0.10
- Neurons with no surviving input dies.

---

## Results
These were the results from the Neural Network:
```terminal
Active weights: 2226 / 7104 (31.3345%)
Accuracy: 4 / 4
Program ended with exit code: 0
```
These results prove that we can have the same effective correct output why using a fraction of the neural network.

---

This is the Neural Network code used:
```cpp
//
//  network.cpp
//  Neural-Network
//
//  Created by Jakub Hammond on 1/26/26.
//

#include <iostream>
#include <vector>
#include <cmath>
#include <random>

// Define Network
constexpr int IMG_W = 12;
constexpr int IMG_H = 12;
constexpr int INPUT = IMG_W * IMG_H; // 144
constexpr int HIDDEN = 48;
constexpr int OUTPUT = 4;

struct Network {
    double W1[INPUT][HIDDEN];
    double W2[HIDDEN][OUTPUT];

    bool M1[INPUT][HIDDEN];
    bool M2[HIDDEN][OUTPUT];
};

// Helpers
void make_label(int label, double y[OUTPUT]) {
    for (int i = 0; i < OUTPUT; i++)
        y[i] = 0.0;
    y[label] = 1.0;
}

// Initialization
double randn() {
    static std::mt19937 gen(42);
    static std::normal_distribution<> dist(0.0, 0.1);
    return dist(gen);
}

void init(Network& net) {
    for (int i = 0; i < INPUT; i++)
        for (int j = 0; j < HIDDEN; j++) {
            net.W1[i][j] = randn();
            net.M1[i][j] = true;
        }

    for (int i = 0; i < HIDDEN; i++)
        for (int j = 0; j < OUTPUT; j++) {
            net.W2[i][j] = randn();
            net.M2[i][j] = true;
        }
}

// Forward pass
inline double relu(double x) {
    return x > 0 ? x : 0;
}

void forward(
    Network& net,
    const double x[INPUT],
    double hidden[HIDDEN],
    double out[OUTPUT]
) {
    for (int j = 0; j < HIDDEN; j++) {
        hidden[j] = 0;
        for (int i = 0; i < INPUT; i++)
            if (net.M1[i][j])
                hidden[j] += x[i] * net.W1[i][j];
        hidden[j] = relu(hidden[j]);
    }

    for (int j = 0; j < OUTPUT; j++) {
        out[j] = 0;
        for (int i = 0; i < HIDDEN; i++)
            if (net.M2[i][j])
                out[j] += hidden[i] * net.W2[i][j];
    }
}

// Backprop
void train_step(
    Network& net,
    const double x[INPUT],
    const double y[OUTPUT],
    double lr
                ) {
    double h[HIDDEN], o[OUTPUT];
    forward(net, x, h, o);
    
    double dO[OUTPUT];
    for (int i = 0; i < OUTPUT; i++)
        dO[i] = 2 * (o[i] - y[i]);
    
    for (int i = 0; i < HIDDEN; i++)
        for (int j = 0; j < OUTPUT; j++)
            if (net.M2[i][j])
                net.W2[i][j] -= lr * h[i] * dO[j];
    
    double dH[HIDDEN] = {};
    for (int i = 0; i < HIDDEN; i++) {
        for (int j = 0; j < OUTPUT; j++)
            if (net.M2[i][j])
                dH[i] += dO[j] * net.W2[i][j];
        if (h[i] <= 0) dH[i] = 0;
    }
    
    for (int i = 0; i < INPUT; i++)
        for (int j = 0; j < HIDDEN; j++)
            if (net.M1[i][j])
                net.W1[i][j] -= lr * x[i] * dH[j];
}

// Continuous pruning
void auto_prune(Network& net, double threshold) {
    // Prune small weights
    for (int i = 0; i < INPUT; i++)
        for (int j = 0; j < HIDDEN; j++)
            if (net.M1[i][j] && std::abs(net.W1[i][j]) < threshold)
                net.M1[i][j] = false;

    for (int i = 0; i < HIDDEN; i++)
        for (int j = 0; j < OUTPUT; j++)
            if (net.M2[i][j] && std::abs(net.W2[i][j]) < threshold)
                net.M2[i][j] = false;

    // Kill dead neurons
    for (int j = 0; j < HIDDEN; j++) {
        bool alive = false;
        for (int i = 0; i < INPUT; i++)
            if (net.M1[i][j]) alive = true;

        if (!alive)
            for (int k = 0; k < OUTPUT; k++)
                net.M2[j][k] = false;
    }
}

// Measuring sparsity
void stats(Network& net) {
    int active = 0, total = 0;

    for (int i = 0; i < INPUT; i++)
        for (int j = 0; j < HIDDEN; j++)
            static_cast<void>(total++), active += net.M1[i][j];

    for (int i = 0; i < HIDDEN; i++)
        for (int j = 0; j < OUTPUT; j++)
            static_cast<void>(total++), active += net.M2[i][j];

    std::cout << "Active weights: " << active
              << " / " << total
              << " (" << 100.0 * active / total << "%)\n";
}

// Image generator
void clear_image(double img[INPUT]) {
    for (int i = 0; i < INPUT; i++)
        img[i] = 0.0;
}

inline int idx(int x, int y) {
    return y * IMG_W + x;
}

void make_image(int label, double img[INPUT]) {
    clear_image(img);

    if (label == 0) { // horizontal line
        int y = IMG_H / 2;
        for (int x = 2; x < IMG_W - 2; x++)
            img[idx(x, y)] = 1.0;
    }
    else if (label == 1) { // vertical line
        int x = IMG_W / 2;
        for (int y = 2; y < IMG_H - 2; y++)
            img[idx(x, y)] = 1.0;
    }
    else if (label == 2) { // diagonal
        for (int i = 2; i < IMG_W - 2; i++)
            img[idx(i, i)] = 1.0;
    }
    else if (label == 3) { // square
        for (int x = 3; x < IMG_W - 3; x++) {
            img[idx(x, 3)] = 1.0;
            img[idx(x, IMG_H - 4)] = 1.0;
        }
        for (int y = 3; y < IMG_H - 3; y++) {
            img[idx(3, y)] = 1.0;
            img[idx(IMG_W - 4, y)] = 1.0;
        }
    }
}

// Main loop
int main() {
    Network net;
    init(net);

    double x[INPUT];
    double y[OUTPUT];

    for (int epoch = 0; epoch < 3000; epoch++) {
        int label = epoch % OUTPUT;

        make_image(label, x);
        make_label(label, y);

        train_step(net, x, y, 0.01);

        // continuously prune and kill dead neurons
        auto_prune(net, 0.10);
    }

    stats(net);

    // Evaluation
    int correct = 0;
    for (int label = 0; label < OUTPUT; label++) {
        make_image(label, x);
        double h[HIDDEN], o[OUTPUT];
        forward(net, x, h, o);

        int pred = 0;
        for (int i = 1; i < OUTPUT; i++)
            if (o[i] > o[pred]) pred = i;

        if (pred == label) correct++;
    }

    std::cout << "Accuracy: " << correct << " / " << OUTPUT << "\n";
}
```

---

## Overall
With this, we can use less compute power and have the same results as a full neural network. Especially for large models.
