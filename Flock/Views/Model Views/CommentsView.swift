// CommentsView.swift
// Flock 
//
// provides the UI for viewing and adding comments
//
// Created by Ramon Jiang 09/011/24

import SwiftUI

struct CommentsView: View {
    let postID: String
    // @StateObject private var viewModel: CommentViewModel
    var isInSheet: Bool
    @ObservedObject var viewModel: CommentViewModel
    
    @State private var newCommentText = ""
    @FocusState private var isCommentFieldFocused: Bool
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.presentationMode) var presentationMode
    
    @State private var viewModelUpdateCounter = 0
    
    var body: some View {
        VStack {
            if isInSheet {
                HStack {
                    Button("Close") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    Spacer()
                    Text("Comments")
                        .font(.headline)
                    Spacer()
                }
                .padding()
            }
            
            commentsList
            
            errorView
            
            commentInputField
        }
        .navigationTitle(isInSheet ? "" : "Comments")
        .onAppear {
            print("CommentsView appeared for post \(postID)")
            fetchCommentsIfNeeded()
        }
        .onChange(of: postID) { newID in
            print("PostID changed to: \(newID)")
            fetchCommentsIfNeeded()
        }
    }

    private func fetchCommentsIfNeeded() {
        guard !postID.isEmpty else {
            print("PostID is empty, not fetching comments")
            return
        }
        Task {
            await viewModel.fetchComments(for: postID)
        }
    }
    
    private var commentsList: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else if viewModel.comments.isEmpty {
                Text("No comments yet. Be the first to comment!")
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                List {
                    ForEach(viewModel.comments) { comment in
                        CommentRow(comment: comment)
                    }
                }
                .listStyle(PlainListStyle())
                .refreshable {
                    Task {
                        await viewModel.refreshComments()
                    }
                }
            }
        }
    }
    
    private var errorView: some View {
        Group {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .padding(.horizontal)
            }
        }
    }
    
    private var commentInputField: some View {
        HStack {
            TextField("Add a comment", text: $newCommentText)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .focused($isCommentFieldFocused)
                .submitLabel(.send)
                .onSubmit {
                    Task {
                        await postComment()
                    }
                }
            
            Button("Post") {
                Task {
                    await postComment()
                }
            }
            .disabled(isCommentTextEmpty)
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(radius: 2)
    }
    
    private var isCommentTextEmpty: Bool {
        newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func postComment() async {
        guard !isCommentTextEmpty else { return }
        await viewModel.addComment(to: postID, text: newCommentText, person: userHolder.person)
        newCommentText = ""
        isCommentFieldFocused = false
        await viewModel.fetchComments(for: postID)
    }
}

struct CommentRow: View {
    let comment: Comment
    
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(comment.username)
                .font(.headline)
            Text(comment.text)
                .font(.body)
            Text(comment.createdAt, style: .relative)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 5)
    }
}