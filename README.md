# Fire and Smoke Recognition System - build guide (follows the WBS)

Educational prototype. **Not a certified alarm or emergency service.** Never write passwords or secret keys in any file.

## What is in this folder (task 2.4.5 folder plan)
- `website/` : `index.html` (landing page), `pages/detection.html` (the detector: camera, upload, result), `pages/history.html`, `pages/about.html`, `assets/css` (style, detection, responsive), `assets/js` (8 modules), `assets/images/`, `model/` (EMPTY until Step 6), `README.md`.
- `ml-training/` : `dataset-preparation/` (notebook 01), `model-training/` (notebook 02), `evaluation/` (notebook 03), `model-export/` (exported TensorFlow.js files). Notebooks run in Google Colab.
- `docs/` : `requirements/`, `test-plans-and-results/`, `project-documentation/` (you fill them: requirements and design, dataset record, test plan and results, final report).

## Team roles (task 3.2.5)
| Role | Members |
|---|---|
| Project Manager | Mark Angelo Mortel & Jan Kyle Cluma |
| Lead Software Developer | Augustine James Salcedo, Gabriel Balili |
| Data Analyst | Charles David Carmona, Francis Dela Cruz, Irene Christopher Salarda |
| System Analyst | Heartlee Virtudazo, John Louie Jumaoas, Karl Andrade |
| Software Developer | Asterio Badang, Jairo Ocampo, Maverick Otaza |
| Technical Writer | Dewayne Gramkow, Earl Josh Palma, Warren Plaza |
| Quality Assurance Analyst | Ciejay Obedencio, Marjenil M. Agraviador |
| Product Presenter | Denver Dave Ojeda, Gian Neil Rodriguez, Lloyd Lacuna |

## Tracker and Git rules (tasks 1.3.1, 3.2.6)
- Shared task tracker: **TODO - paste the link here**
- Branch rule: nobody changes `main` directly. Make a branch for each task and open a pull request.
- Review rule: another member must review the code before it is merged.
- Never commit passwords or secret keys.

## Decisions already made in this build (change them in the Decision Log if the team disagrees)
1. **History is INCLUDED.** `pages/history.html` and `assets/js/history.js` show the last 50 results (word, score, time). They are kept in the browser on this device only. Pictures are never saved. Write this in the Decision Log (task 2.1.11).
2. `.vscode/settings.json` makes Live Server open `website/index.html` directly. `index.html` is in the `website/` root so a host can open it; `detection.html`, `history.html` and `about.html` are in `website/pages/`.
3. Allowed files: JPG and PNG, max 5 MB (task 2.1.4). Class order: `fire, smoke, neither`. Input size 224. Pixel rule: `x / 127.5 - 1`, RGB.
4. These three must stay identical in the notebook and in `website/assets/js/model-loader.js`: `CLASS_ORDER`, `INPUT_SIZE` (= `IMAGE_SIZE`), preprocessing.

## What is NOT done yet (only your team can do it)
- **No model is included.** It needs your dataset and Colab training. Until `website/model/` holds the real files, the site correctly shows "The model could not be loaded." and never a fake result.
- Dataset licence/credit text on `about.html` (marked TODO), the `docs/` content, and the checkpoint sign-offs.
- I tested the website logic with a mock model in a simulated browser (upload, errors, results, thresholds). I did **not** run the notebooks in Colab or test on a real phone camera. Do the checks in Step 7 and 8.

---
## Step-by-step

### Step 1 - Workspace and tools (Phase 3)
1. Install **VS Code**. In VS Code install the extension **Live Server**.
2. Open this folder: File > Open Folder > `fire-smoke-recognition`.
3. Make a Git repository (task 1.3.1): `git init`, then push it to a private online repository. Write the branch and review rule in the README. Do not commit passwords.
4. Make a shared task tracker and a **Decision Log** (tasks 1.1.3, 1.1.5). Put the tracker link in this README (task 3.2.6).
5. Open Google Colab, create the three notebooks from the three `.ipynb` files (File > Upload notebook). Save each one in its folder: 01 in `ml-training/dataset-preparation`, 02 in `ml-training/model-training`, 03 in `ml-training/evaluation`. Run a `print('hello')` cell in each (task 3.3.4).
6. Click **Go Live** (bottom-right of VS Code). The project already has `.vscode/settings.json`, so `http://127.0.0.1:5500` opens the website directly (no folder list). If the folder list still shows, click **Port: 5500** to stop the server, then Go Live again. You should see the page, "The model could not be loaded. Analyze is switched off." and a disabled Analyze button. That is correct for now. **Never test the camera by double-clicking the HTML file** (task 3.4.3).

### Using it on your phone
The layout is phone-first. `127.0.0.1` only works on the computer itself, and phone browsers block the camera on plain `http://` addresses. So:
- **Real phone use (camera works):** publish the `website` folder to a free https host (Step 9), then open that https address on the phone. Fastest way: drag the `website` folder onto Netlify Drop.
- **Quick look from the same Wi-Fi:** open `http://<your-computer-IP>:5500` on the phone. The page and Upload picture work; Start camera will not.

### Step 2 - Dataset (Phase 4)
1. Find the **official** page of the dataset (for example D-Fire). Record: name, link, access date, **licence**, restrictions, in the Decision Log (tasks 4.1.1, 4.1.2, 1.2.4). Read its documentation (4.1.3).
2. Decide the meaning of Fire, Smoke, Neither and the "both" rule (4.1.5, 4.1.6). Decide ADOPT or REJECT with the Project Manager (4.1.8). If rejected, pick another dataset.
3. Upload the images and the YOLO label `.txt` files to Google Drive (for example `dfire/images`, `dfire/labels`). Optional: put clouds, fog, steam, sunsets, bright-light pictures in `hard_negatives` (4.3.4).
4. Open **notebook 01**. In cell 1 fix every line marked CHANGE or VERIFY. **Check the class ids (`FIRE_ID`, `SMOKE_ID`) in the dataset documentation. Do not guess.**
5. Set `group_key` so pictures from the same video or scene stay together (4.2.3). The default does NOT group them. Look at your file names and write the rule before you trust the split.
6. Run all cells. Look at the 100-picture grid; count wrong labels. **If more than 5 are wrong, fix the rules and run again.** Check that "no label file" pictures are truly Neither (4.1.7).
7. Notebook 01 saves `class_counts.csv` and `exclusion_log.csv` and copies the dataset to Drive (`fire-smoke-dataset`). Copy those numbers and the seed into `docs/project-documentation` (4.4.x, dataset record). Note: it removes exact duplicate files only; look for near-duplicates by eye (4.2.4).
8. Checkpoint 4: the next owner says "I can start".

### Step 3 - Train (Phase 5)
1. Open **notebook 02**. Run cell 1 (installs). Then **Runtime > Restart session**. Run cell 2 onward.
2. It loads train and validation, checks they share no files, applies augmentation to TRAIN only, builds MobileNetV2 (frozen) + 3-class head, trains, and saves `best.h5` (best **validation** loss) to Drive `fire-smoke-model`.
3. Look at the loss chart. If training improves but validation gets worse, it is overfitting (5.5.4): lower `EPOCHS`, then rerun.
4. Optional fine-tuning (5.6): set `FINE_TUNE = True`, rerun from the fine-tune cell. It keeps the better model automatically.
5. The threshold cell prints a table. Pick one threshold from the **validation** numbers, write the trade-off (10.2.2).
6. The config cell writes `training_config.json` (tasks 5.7.x). Copy it into your docs.

### Step 4 - Evaluate (Phase 6)
1. Open **notebook 03**. Run it **once**. It checks the test set is separate, then prints accuracy, precision, recall, saves the confusion matrix and `wrong_predictions.csv`.
2. Review wrong pictures and confusing scenes; write the honest report with the sentence "This is not reliable enough for real emergency protection." Save it in `ml-training/evaluation` (6.4.x).
3. Do not change the model after seeing these numbers.

### Step 5 - Export for the browser (Phase 9.1)
1. The last cell of notebook 02 runs `tensorflowjs_converter` and writes `tfjs_model.zip` to Drive.
2. If the converter fails to install or run: open a **new** Colab, run `pip install tensorflowjs`, upload `best.h5`, run `tensorflowjs_converter --input_format=keras best.h5 tfjs_model`. Write the exact command you used in the Decision Log (9.1.3).
3. Keep a copy of `tfjs_model.zip` in `ml-training/model-export`. Unzip. You must see `model.json` and one or more `.bin` files. **Never create or edit them by hand.**
4. Copy **ALL** of them into `website/model/` with the same file names. None may be 0 bytes (9.1.5).

### Step 6 - Put your settings into the website (Phase 9.3 and 10.2)
Open `website/assets/js/model-loader.js` and check the settings block:
- `THRESHOLD` = the value you chose in notebook 02 (the default 0.6 is only a placeholder).
- `CLASS_ORDER` = `['fire','smoke','neither']` = notebook 02. `INPUT_SIZE` = 224 = notebook 02.
- Have the Lead Developer and Data Analyst both sign the class mapping (9.3.4).

### Step 7 - Run and check locally (Phase 9.4 to 9.6)
1. Reload with Live Server. "Model ready." must appear. The browser console (F12) shows `model loaded`.
2. **Parity test (9.5):** put 10-20 pictures (all classes + cloud, fog, sunset) in Drive `parity_samples`, run the last cell of notebook 03 (gives `python_scores.csv`). Upload the same pictures on the website and read "All scores". The chosen class and score order must match; tiny differences are normal. If not, check in this order: resize, pixel numbers, RGB order, class order, conversion (9.5.5).
3. Do not connect real results to the page for the demo until the parity test is satisfactory (9.6.1).
4. Force each error on purpose and confirm there is a message and **no result**: upload a PDF, a file over 5 MB, a text file renamed `.jpg`, deny camera permission, and rename a model file.
5. Check the safety notice at the bottom is visible on every page and in every state (10.4.2).

### Step 8 - Test and record evidence (Phase 11)
Use the test cases in tasks 11.1 to 11.5: homepage, camera on each target phone and browser, capture, upload, invalid files, loading/error messages, camera and upload reach the model, warnings, mobile/desktop layout (360 px, 768 px, 1280 px). Time model load and prediction 5 times per device (targets: load 5 s or less, prediction 2 s or less). Log every defect with the 6 fields (11.6.1), fix, retest. Fixes stop Thu Nov 12; Fri Nov 13 is retest only. Edit the `.css` / `.js` files only for fixes.

### Step 9 - Publish (Phase 12)
1. Choose a free host that gives **https** (the camera needs it): for example Netlify, Cloudflare Pages or GitHub Pages. Write the choice in the Decision Log (12.1.1).
2. Check no passwords or secrets in any file; check all paths are relative (they already are) (12.1.2, 12.1.3).
3. Upload the **`website` folder contents** (so `index.html` is at the top). Open the live address: it must start with `https://` (12.2.2).
4. Open developer tools > Network: `model.json` and every `.bin` must load with no red lines (12.2.3).
5. Put the live address in this README and the tracker. Run the live tests on every target phone (12.3). Keep a local backup that runs from localhost for the demo (12.4.3).

### Step 10 - Finish (Phases 13 and 14)
Fill `docs/` (`requirements`, `test-plans-and-results`, `project-documentation`); fill the dataset credit on `pages/about.html`; write the maintenance plan; sign each checkpoint PASS in the Decision Log; the Project Manager signs the final checklist.

## Quick fixes
- **Camera does nothing:** you opened the file directly or the address is not `https://` / `localhost`.
- **"The model could not be loaded.":** `website/model/model.json` or a `.bin` is missing, renamed or 0 bytes. Check the Network tab.
- **Wrong class shown (Fire shown as Smoke):** `CLASS_ORDER` differs between notebook 02 and `model-loader.js`.
- **Browser results differ from Python:** see Step 7.2.
- **Scores look odd:** the model must end with softmax (it does in notebook 02); do not call scores "probabilities".
