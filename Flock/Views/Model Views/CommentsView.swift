// CommentsView.swift
// Flock 
//
// provides the UI for viewing and adding comments
//
// Created by Ramon Jiang 09/011/24

import SwiftUI

struct CommentsView: View {
    let postID: String
    @StateObject private var viewModel: CommentViewModel
    @State private var newCommentText = ""
    @Environment(UserProfileHolder.self) var userHolder
    @FocusState private var isCommentFieldFocused: Bool
    
    init(postID: String) {
        self.postID = postID
        _viewModel = StateObject(wrappedValue: CommentViewModel())
    }
    
    var body: some View {
        VStack {
            commentsList
            
            errorView
            
            commentInputField
        }
        .navigationTitle("Comments")
        .task {
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
                    await viewModel.refreshComments()
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
                .onSubmit(postComment)
            
            Button("Post", action: postComment)
                .disabled(isCommentTextEmpty)
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(radius: 2)
    }
    
    private var isCommentTextEmpty: Bool {
        newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func postComment() {
        guard !isCommentTextEmpty else { return }
        Task {
            await viewModel.addComment(to: postID, text: newCommentText, person: userHolder.person)
            newCommentText = ""
            isCommentFieldFocused = false
        }
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
